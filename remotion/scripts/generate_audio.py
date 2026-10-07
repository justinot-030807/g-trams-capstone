import asyncio
import edge_tts
import os
import math
import wave
import struct

VOICE = "fil-PH-AngeloNeural"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "remotion", "public", "audio")
os.makedirs(OUTPUT_DIR, exist_ok=True)

SCRIPTS = {
    "scene1_hook.mp3": "Sa Gasan, bawal na ang maghapon sa pila.",
    "scene2_problem.mp3": "Nawawalang requirements, colorum na byahe, at paulit-ulit na balik sa munisipyo. Tapos na 'yan.",
    "scene3_demo.mp3": "Ito ang G-TRAMS. I-renew ang prangkisa sa cellphone, i-upload ang OR/CR, at kunin ang digital claim voucher sa ilang minuto lang.",
    "scene4_proof.mp3": "Real-time masterlist para sa munisipyo. Bawat byahe, lehitimo at ligtas para sa bawat pasahero.",
    "scene5_cta.mp3": "Mag-apply ngayon sa g-trams-web2.vercel.app. G-TRAMS: mabilis, malinis, diretsahan."
}

async def generate_narration():
    print("Generating voice narration with edge-tts...")
    for filename, text in SCRIPTS.items():
        filepath = os.path.join(OUTPUT_DIR, filename)
        communicate = edge_tts.Communicate(text, VOICE, rate="+5%")
        await communicate.save(filepath)
        size = os.path.getsize(filepath)
        print(f"Generated {filename} ({size} bytes)")

def generate_sfx():
    print("Synthesizing minimalist modern SFX...")
    sample_rate = 44100

    # 1. Whoosh (filtered white noise sweep)
    whoosh_path = os.path.join(OUTPUT_DIR, "whoosh.wav")
    duration = 0.35
    num_samples = int(duration * sample_rate)
    with wave.open(whoosh_path, 'w') as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(sample_rate)
        frames = bytearray()
        import random
        for i in range(num_samples):
            t = i / num_samples
            env = math.sin(t * math.pi)
            noise = (random.random() * 2 - 1)
            # low-pass sweep
            freq = 200 + 800 * math.sin(t * math.pi)
            sample = int((noise * 0.4 + math.sin(2 * math.pi * freq * (i / sample_rate)) * 0.6) * env * 12000)
            sample = max(-32767, min(32767, sample))
            frames.extend(struct.pack('<h', sample))
        wav.writeframes(frames)
    print("Generated whoosh.wav")

    # 2. Tactile Click (sharp pop & rapid decay)
    click_path = os.path.join(OUTPUT_DIR, "click.wav")
    duration = 0.08
    num_samples = int(duration * sample_rate)
    with wave.open(click_path, 'w') as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(sample_rate)
        frames = bytearray()
        for i in range(num_samples):
            t = i / num_samples
            decay = math.exp(-t * 35)
            sample = int(math.sin(2 * math.pi * 1800 * (i / sample_rate)) * decay * 18000)
            sample = max(-32767, min(32767, sample))
            frames.extend(struct.pack('<h', sample))
        wav.writeframes(frames)
    print("Generated click.wav")

    # 3. Soft Confirmation Tick / Pop
    tick_path = os.path.join(OUTPUT_DIR, "tick.wav")
    duration = 0.12
    num_samples = int(duration * sample_rate)
    with wave.open(tick_path, 'w') as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(sample_rate)
        frames = bytearray()
        for i in range(num_samples):
            t = i / num_samples
            decay = math.exp(-t * 25)
            # Pleasant dual tone (880Hz + 1320Hz)
            sample = int((math.sin(2 * math.pi * 880 * (i / sample_rate)) * 0.6 + 
                          math.sin(2 * math.pi * 1320 * (i / sample_rate)) * 0.4) * decay * 16000)
            sample = max(-32767, min(32767, sample))
            frames.extend(struct.pack('<h', sample))
        wav.writeframes(frames)
    print("Generated tick.wav")

    # 4. Minimal Modern Background Bed Music (30 seconds loop, subtle deep bass pulse + warm rhodes chords)
    bgm_path = os.path.join(OUTPUT_DIR, "bgm_minimal.wav")
    bgm_duration = 31.0
    num_samples = int(bgm_duration * sample_rate)
    with wave.open(bgm_path, 'w') as wav:
        wav.setnchannels(2)
        wav.setsampwidth(2)
        wav.setframerate(sample_rate)
        frames = bytearray()
        bpm = 115
        spb = 60.0 / bpm
        # Chords: Dm9, Bbmaj7, Fmaj7, C
        chord_freqs = [
            [146.83, 220.00, 261.63, 329.63], # Dm9
            [116.54, 174.61, 220.00, 261.63], # Bbmaj7
            [174.61, 220.00, 261.63, 329.63], # Fmaj7
            [130.81, 164.81, 196.00, 246.94]  # C
        ]
        for i in range(num_samples):
            t = i / sample_rate
            # 8-bar loop
            bar = int((t / (spb * 4))) % 4
            current_chord = chord_freqs[bar]
            
            # Subtle smooth pad synthesizer
            pad = 0.0
            for f in current_chord:
                pad += math.sin(2 * math.pi * f * t) * 0.25
            
            # Soft sub-bass kick pulse on beats 1 and 3
            beat_phase = (t % spb) / spb
            sub = 0.0
            if beat_phase < 0.2:
                kick_env = math.exp(-beat_phase * 22)
                sub = math.sin(2 * math.pi * 55 * t) * kick_env * 0.7
            
            # Gentle shaker / click on offbeats
            shaker = 0.0
            eighth_phase = (t % (spb / 2)) / (spb / 2)
            if eighth_phase < 0.08:
                import random
                shaker = (random.random() * 2 - 1) * math.exp(-eighth_phase * 40) * 0.15

            # Global mix and fade out in last 2 seconds
            master_fade = 1.0
            if t > 28.5:
                master_fade = max(0.0, 1.0 - (t - 28.5) / 1.5)
            
            mix_l = int((pad * 0.45 + sub * 0.4 + shaker * 0.15) * master_fade * 14000)
            mix_r = int((pad * 0.45 + sub * 0.4 - shaker * 0.15) * master_fade * 14000)

            mix_l = max(-32767, min(32767, mix_l))
            mix_r = max(-32767, min(32767, mix_r))
            frames.extend(struct.pack('<hh', mix_l, mix_r))
        wav.writeframes(frames)
    print("Generated bgm_minimal.wav")

async def main():
    await generate_narration()
    generate_sfx()
    print("All audio assets generated successfully in remotion/public/audio/")

if __name__ == "__main__":
    asyncio.run(main())
