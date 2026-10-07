import asyncio
import edge_tts
import os
from mutagen.mp3 import MP3

VOICE = "fil-PH-AngeloNeural"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "remotion", "public", "audio")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Slightly concise & punchy scripts tuned for 30s structure (900 frames @ 30fps)
SCRIPTS = {
    # Scene 1: Hook (3s / 90 frames)
    "scene1_hook.mp3": ("Sa Gasan, bawal na ang maghapon sa pila.", "+12%"),
    
    # Scene 2: Problem (5s / 150 frames)
    "scene2_problem.mp3": ("Nawawalang requirements, colorum na byahe, at pabalik-balik sa munisipyo. Tapos na 'yan.", "+14%"),
    
    # Scene 3: Solution & Demo (10s / 300 frames)
    "scene3_demo.mp3": ("Ito ang G-TRAMS. I-renew ang prangkisa sa cellphone, i-upload ang OR/CR, at kunin ang digital claim voucher sa ilang minuto.", "+14%"),
    
    # Scene 4: Proof (6s / 180 frames)
    "scene4_proof.mp3": ("Real-time masterlist para sa MTFRB. Bawat byahe, lehitimo at ligtas para sa pasahero.", "+14%"),
    
    # Scene 5: CTA (6s / 180 frames)
    "scene5_cta.mp3": ("Mag-apply ngayon sa g-trams-web2.vercel.app. G-TRAMS: mabilis, malinis, diretsahan.", "+14%")
}

async def generate_narration():
    print("Generating voice narration with edge-tts tuned for 30s...")
    durations = {}
    for filename, (text, rate) in SCRIPTS.items():
        filepath = os.path.join(OUTPUT_DIR, filename)
        communicate = edge_tts.Communicate(text, VOICE, rate=rate)
        await communicate.save(filepath)
        audio = MP3(filepath)
        durations[filename] = audio.info.length
        print(f"Generated {filename}: {audio.info.length:.2f}s ({int(audio.info.length * 30)} frames)")
    return durations

if __name__ == "__main__":
    asyncio.run(generate_narration())
