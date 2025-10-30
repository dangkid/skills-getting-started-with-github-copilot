"""
High School Management System API

A super simple FastAPI application that allows students to view and sign up
for extracurricular activities at Mergington High School.
"""

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
import os
from pathlib import Path

app = FastAPI(title="Mergington High School API",
              description="API for viewing and signing up for extracurricular activities")

# Mount the static files directory
current_dir = Path(__file__).parent
app.mount("/static", StaticFiles(directory=os.path.join(Path(__file__).parent,
          "static")), name="static")

# In-memory activity database
activities = {
    "Chess Club": {
        "description": "Learn strategies and compete in chess tournaments",
        "schedule": "Fridays, 3:30 PM - 5:00 PM",
        "max_participants": 12,
        "participants": ["michael@mergington.edu", "daniel@mergington.edu"]
    },
    "Programming Class": {
        "description": "Learn programming fundamentals and build software projects",
        "schedule": "Tuesdays and Thursdays, 3:30 PM - 4:30 PM",
        "max_participants": 20,
        "participants": ["emma@mergington.edu", "sophia@mergington.edu"]
    },
    "Gym Class": {
        "description": "Physical education and sports activities",
        "schedule": "Mondays, Wednesdays, Fridays, 2:00 PM - 3:00 PM",
        "max_participants": 30,
        "participants": ["john@mergington.edu", "olivia@mergington.edu"]
    },
    # Sports-related activities
    "Basketball Team": {
        "description": "Competitive basketball practice and inter-school matches",
        "schedule": "Tuesdays and Thursdays, 5:00 PM - 7:00 PM",
        "max_participants": 15,
        "participants": ["alex@mergington.edu", "rachel@mergington.edu"]
    },
    "Swimming Club": {
        "description": "Lap swimming, technique drills and swim meets",
        "schedule": "Mondays and Wednesdays, 6:00 AM - 7:30 AM",
        "max_participants": 18,
        "participants": ["nina@mergington.edu", "luke@mergington.edu"]
    },
    # Artistic activities
    "Art Workshop": {
        "description": "Painting, drawing and mixed-media projects",
        "schedule": "Wednesdays, 4:00 PM - 6:00 PM",
        "max_participants": 16,
        "participants": ["maria@mergington.edu", "sam@mergington.edu"]
    },
    "Drama Club": {
        "description": "Acting exercises, rehearsals and school productions",
        "schedule": "Fridays, 4:00 PM - 6:00 PM",
        "max_participants": 20,
        "participants": ["isabella@mergington.edu", "thomas@mergington.edu"]
    },
    # Intellectual activities
    "Science Club": {
        "description": "Hands-on experiments, guest talks and science fairs",
        "schedule": "Thursdays, 4:30 PM - 6:00 PM",
        "max_participants": 20,
        "participants": ["oliver@mergington.edu", "zoe@mergington.edu"]
    },
    "Debate Society": {
        "description": "Formal debates, public speaking and reasoning skills",
        "schedule": "Mondays, 4:00 PM - 5:30 PM",
        "max_participants": 24,
        "participants": ["harry@mergington.edu", "emma.k@mergington.edu"]
    }
}


@app.get("/")
def root():
    return RedirectResponse(url="/static/index.html")


@app.get("/activities")
def get_activities():
    return activities


@app.post("/activities/{activity_name}/signup")
def signup_for_activity(activity_name: str, email: str):
    """Sign up a student for an activity"""
    # Validate activity exists
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")

    # Get the specific activity
    activity = activities[activity_name]

    # Validate student is not already signed up
    if email in activity["participants"]:
        raise HTTPException(status_code=400, detail="Student is already signed up")

    # Optional: check capacity
    if len(activity["participants"]) >= activity["max_participants"]:
        raise HTTPException(status_code=400, detail="Activity is full")

    # Add student
    activity["participants"].append(email)
    return {"message": f"Signed up {email} for {activity_name}"}


@app.delete("/activities/{activity_name}/signup")
def unregister_from_activity(activity_name: str, email: str):
    """Unregister a student from an activity (by email).

    Accepts the student email as a query parameter `email`.
    """
    # Validate activity exists
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")

    activity = activities[activity_name]

    # Validate the student is signed up
    if email not in activity.get("participants", []):
        raise HTTPException(status_code=404, detail="Participant not found")

    # Remove the participant
    activity["participants"].remove(email)

    return {"message": f"Removed {email} from {activity_name}"}
