from src.vision import VideoProcessor

if __name__ == "__main__":
    print("Inicjalizacja procesora wizyjnego...")

    processor = VideoProcessor()

    print("Uruchamiam kamerę (wciśnij 'q', aby wyjść)...")

    data_from_transition = processor.process_video(video_source = 0, show_video = True)

    print(f"Przetwarzanie zakończone. Zapisano dane dla {len(data_from_transition)} klatek.")