"""
Main entry point for the Boulder AI backend application.
Exposes RESTful endpoints via FastAPI for video analysis and database operations.
"""
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from src.vision import VideoProcessor
from src.analytics import DataAnalyzer
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI(title = "Boulder AI", version = "1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins = ["*"],
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"],
)

@app.get("/")
def read_root():
    """
    Health check endpoint to verify API status.
    """
    return {"message": "API analizatora jest online."}

@app.post("/analyze")
async def analyze_video(
    file: UploadFile = File(...), 
    climber_height: float = Form(1.70),
    user_id: str = Form(None)
):
    """
    Processes an uploaded climbing video through the AI vision and biomechanics pipeline.
    
    Args:
        file (UploadFile): The MP4 video file to be analyzed.
        climber_height (float): User's height in meters for physical calibration.
        user_id (str): Optional Supabase UUID of the logged-in user.
        
    Returns:
        dict: The complete analytics payload containing aggregate summary stats 
              and frame-by-frame positional data for UI rendering.
    """
    temp_video_path = f"temp_{file.filename}"
    with open(temp_video_path, "wb") as buffer:
        buffer.write(await file.read())
    
    json_output_path = f"data_{file.filename}.json"

    try:
        processor = VideoProcessor()
        processor.process_video(
            video_source = temp_video_path,
            show_video = False,
            output_json = json_output_path
        )

        analyzer = DataAnalyzer(json_path = json_output_path)
        stats = analyzer.get_movement_summary(climber_height_m = climber_height)
        chart_data = analyzer.df[["timestamp", "com_velocity_smooth", "movement_phase"]].fillna(0).to_dict(orient = "records")

        if os.path.exists(temp_video_path): os.remove(temp_video_path)
        if os.path.exists(json_output_path): os.remove(json_output_path)

        return {
            "status": "success",
            "filename": file.filename,
            "summary": stats,
            "chart_data": chart_data
        }
    
    except Exception as e:
        if os.path.exists(temp_video_path): os.remove(temp_video_path)
        if os.path.exists(json_output_path): os.remove(json_output_path)
        print(f"[API] BŁĄD: {str(e)}")
        return {"status": "error", "message": str(e)}
    
@app.post("/save-analysis")
async def save_analysis(data: dict):
    """
    Persists the processed climbing analytics payload into the Supabase database.
    
    Args:
        data (dict): The analytics payload containing user_id and session metrics.
        
    Returns:
        dict: Success status and the newly created database record ID.
    """
    try:
        response = supabase.table("analyses").insert(data).execute()
        return {"status": "success", "id": response.data[0]["id"]}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    
if __name__ == "__main__":
        uvicorn.run("main:app", host = "127.0.0.1", port = 8000, reload = True)
