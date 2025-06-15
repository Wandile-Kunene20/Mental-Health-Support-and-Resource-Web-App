import requests
import unittest
import os
import time
from datetime import datetime

# Get the backend URL from the frontend .env file
with open('/app/frontend/.env', 'r') as f:
    for line in f:
        if line.startswith('REACT_APP_BACKEND_URL='):
            BACKEND_URL = line.strip().split('=')[1].strip('"')
            break

# Ensure the URL doesn't have quotes
BACKEND_URL = BACKEND_URL.strip("'\"")
API_BASE_URL = f"{BACKEND_URL}/api"

print(f"Testing against backend URL: {API_BASE_URL}")

class MentalHealthAPITest(unittest.TestCase):
    
    def setUp(self):
        # Check if the backend is healthy before running tests
        try:
            response = requests.get(f"{API_BASE_URL}/health")
            response.raise_for_status()
            print("Backend health check passed")
        except Exception as e:
            print(f"Backend health check failed: {e}")
            raise
    
    def test_health_endpoint(self):
        """Test the health check endpoint"""
        response = requests.get(f"{API_BASE_URL}/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["service"], "Mental Health Resource API")
        print("✅ Health endpoint test passed")
    
    def test_ai_chat_api(self):
        """Test the AI Mental Health Companion Chat API"""
        try:
            # Test with a new session
            payload = {
                "message": "I've been feeling anxious lately and having trouble sleeping."
            }
            response = requests.post(f"{API_BASE_URL}/chat", json=payload)
            
            # Check if the API is working
            if response.status_code == 200:
                data = response.json()
                self.assertIn("response", data)
                self.assertIn("session_id", data)
                self.assertTrue(len(data["response"]) > 0)
                session_id = data["session_id"]
                print("✅ AI Chat API initial message test passed")
                
                # Test with the same session ID for conversation continuity
                follow_up_payload = {
                    "message": "What are some techniques I can use to manage my anxiety?",
                    "session_id": session_id
                }
                response = requests.post(f"{API_BASE_URL}/chat", json=follow_up_payload)
                self.assertEqual(response.status_code, 200)
                data = response.json()
                self.assertEqual(data["session_id"], session_id)
                self.assertTrue(len(data["response"]) > 0)
                print("✅ AI Chat API follow-up message test passed")
                
                # Test chat history retrieval
                response = requests.get(f"{API_BASE_URL}/chat/history/{session_id}")
                self.assertEqual(response.status_code, 200)
                data = response.json()
                self.assertIn("conversations", data)
                conversations = data["conversations"]
                self.assertTrue(len(conversations) >= 2)  # Should have at least our two messages
                self.assertEqual(conversations[0]["user_message"], payload["message"])
                self.assertEqual(conversations[1]["user_message"], follow_up_payload["message"])
                print("✅ Chat history retrieval test passed")
                
                # Test with a mental health crisis message
                crisis_payload = {
                    "message": "I'm feeling really down and sometimes think about hurting myself.",
                    "session_id": session_id
                }
                response = requests.post(f"{API_BASE_URL}/chat", json=crisis_payload)
                self.assertEqual(response.status_code, 200)
                data = response.json()
                crisis_response = data["response"].lower()
                # Check if the response contains crisis-appropriate content
                crisis_keywords = ["professional", "help", "support", "emergency", "crisis", "resources"]
                self.assertTrue(any(keyword in crisis_response for keyword in crisis_keywords))
                print("✅ AI Chat API crisis message handling test passed")
            else:
                # If the API returns an error, check the response for more information
                print(f"❌ AI Chat API test failed with status code: {response.status_code}")
                print(f"Response: {response.text}")
                
                # Check if we can get more information about the error
                if response.status_code == 500:
                    print("The AI Chat API is returning a 500 Internal Server Error.")
                    print("This is likely due to an issue with the emergentintegrations library.")
                    print("The library may not be properly installed in the supervisor environment.")
                    
                    # Check if we can access the chat history endpoint
                    test_session_id = "test-session-id"
                    history_response = requests.get(f"{API_BASE_URL}/chat/history/{test_session_id}")
                    if history_response.status_code == 200:
                        print("✅ Chat history endpoint is working")
                    else:
                        print(f"❌ Chat history endpoint failed with status code: {history_response.status_code}")
                
                # Mark the test as failed but continue with other tests
                self.fail("AI Chat API test failed")
                
        except Exception as e:
            print(f"❌ AI Chat API test failed with exception: {str(e)}")
            self.fail(f"AI Chat API test failed with exception: {str(e)}")
    
    def test_mood_tracking_api(self):
        """Test the Mood Tracking API"""
        # Test mood logging
        mood_payload = {
            "mood_level": 7,
            "notes": "Feeling pretty good today after meditation",
            "activities": ["meditation", "exercise", "reading"]
        }
        response = requests.post(f"{API_BASE_URL}/mood", json=mood_payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["mood_level"], mood_payload["mood_level"])
        self.assertEqual(data["notes"], mood_payload["notes"])
        self.assertEqual(data["activities"], mood_payload["activities"])
        self.assertIn("id", data)
        self.assertIn("timestamp", data)
        mood_id = data["id"]
        print("✅ Mood logging test passed")
        
        # Test mood logging with minimal data
        minimal_mood_payload = {
            "mood_level": 3
        }
        response = requests.post(f"{API_BASE_URL}/mood", json=minimal_mood_payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["mood_level"], minimal_mood_payload["mood_level"])
        self.assertEqual(data["notes"], "")
        self.assertEqual(data["activities"], [])
        print("✅ Minimal mood logging test passed")
        
        # Test mood history retrieval
        response = requests.get(f"{API_BASE_URL}/mood/history")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("mood_entries", data)
        entries = data["mood_entries"]
        self.assertTrue(len(entries) >= 2)  # Should have at least our two entries
        
        # Verify our entries are in the history
        found_full_entry = False
        found_minimal_entry = False
        for entry in entries:
            if entry.get("id") == mood_id:
                found_full_entry = True
                self.assertEqual(entry["mood_level"], mood_payload["mood_level"])
                self.assertEqual(entry["notes"], mood_payload["notes"])
                self.assertEqual(entry["activities"], mood_payload["activities"])
            elif entry.get("mood_level") == minimal_mood_payload["mood_level"] and entry.get("notes") == "" and entry.get("activities") == []:
                found_minimal_entry = True
        
        self.assertTrue(found_full_entry)
        self.assertTrue(found_minimal_entry)
        print("✅ Mood history retrieval test passed")
        
        # Test mood history with limit
        limit = 1
        response = requests.get(f"{API_BASE_URL}/mood/history?limit={limit}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("mood_entries", data)
        self.assertEqual(len(data["mood_entries"]), limit)
        print("✅ Mood history with limit test passed")
    
    def test_mental_health_resources_api(self):
        """Test the Mental Health Resources API"""
        # Test getting all resources
        response = requests.get(f"{API_BASE_URL}/resources")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("resources", data)
        resources = data["resources"]
        self.assertTrue(len(resources) >= 4)  # Should have at least the 4 sample resources
        print("✅ Get all resources test passed")
        
        # Test getting resources by category
        categories = ["anxiety", "coping-strategies", "mindfulness", "professional-help"]
        for category in categories:
            response = requests.get(f"{API_BASE_URL}/resources?category={category}")
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertIn("resources", data)
            category_resources = data["resources"]
            self.assertTrue(len(category_resources) > 0)
            for resource in category_resources:
                self.assertEqual(resource["category"], category)
        print("✅ Get resources by category test passed")
        
        # Test getting resource categories
        response = requests.get(f"{API_BASE_URL}/resources/categories")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("categories", data)
        self.assertTrue(len(data["categories"]) >= 4)  # Should have at least the 4 sample categories
        for category in categories:
            self.assertIn(category, data["categories"])
        print("✅ Get resource categories test passed")
        
        # Test creating a new resource
        new_resource = {
            "title": "Test Resource",
            "category": "test-category",
            "description": "A test resource for API testing",
            "content": "This is the content of the test resource.",
            "url": "https://example.com/test-resource"
        }
        response = requests.post(f"{API_BASE_URL}/resources", json=new_resource)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        for key in new_resource:
            self.assertEqual(data[key], new_resource[key])
        self.assertIn("id", data)
        self.assertIn("timestamp", data)
        
        # Verify the new resource is retrievable
        response = requests.get(f"{API_BASE_URL}/resources?category=test-category")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("resources", data)
        test_resources = data["resources"]
        self.assertTrue(len(test_resources) > 0)
        found = False
        for resource in test_resources:
            if resource["title"] == new_resource["title"]:
                found = True
                for key in new_resource:
                    self.assertEqual(resource[key], new_resource[key])
                break
        self.assertTrue(found)
        print("✅ Create and retrieve resource test passed")
    
    def test_crisis_support_api(self):
        """Test the Crisis Support Information API"""
        response = requests.get(f"{API_BASE_URL}/crisis-resources")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Check emergency contacts
        self.assertIn("emergency_contacts", data)
        contacts = data["emergency_contacts"]
        self.assertTrue(len(contacts) >= 3)  # Should have at least 3 emergency contacts
        
        # Verify specific emergency services
        service_names = [contact["name"] for contact in contacts]
        expected_services = ["National Suicide Prevention Lifeline", "Crisis Text Line", "SAMHSA National Helpline"]
        for service in expected_services:
            self.assertIn(service, service_names)
        
        # Check immediate steps
        self.assertIn("immediate_steps", data)
        steps = data["immediate_steps"]
        self.assertTrue(len(steps) >= 5)  # Should have at least 5 immediate steps
        
        # Verify specific steps content
        step_content = " ".join(steps).lower()
        expected_keywords = ["emergency", "help", "reach out", "trusted", "grounding", "not alone"]
        for keyword in expected_keywords:
            self.assertIn(keyword, step_content)
        
        print("✅ Crisis support information test passed")


if __name__ == "__main__":
    unittest.main(argv=['first-arg-is-ignored'], exit=False)