"""Original 48-second ambient loop; Python stdlib only. Encode WAV with ffmpeg.
No samples, borrowed melodies, recordings, or third-party audio.
"""
import math
import random
import struct
import wave
from pathlib import Path

RATE, SECONDS = 24000, 48
N = RATE * SECONDS
TAU = math.tau
random.seed(81989649)
# D minor / suspended voicings. Frequencies land on the loop's Fourier bins,
# so pads, wind, and overlapping bell tails meet continuously at the boundary.
notes = [146.8324, 220, 293.6648, 329.6276, 349.2282, 440]
freqs = [round(f * SECONDS) / SECONDS for f in notes]
bells = [(3, 587.3295), (12, 659.2551), (23, 440), (32, 698.4565), (41, 587.3295)]
wind = [(random.uniform(.0001, .0005), random.randint(200, 45000), random.uniform(0, TAU)) for _ in range(32)]
output = Path('/tmp/mamont1k-blue-hour.wav')
with wave.open(str(output), 'wb') as wav:
    wav.setparams((2, 2, RATE, N, 'NONE', 'not compressed'))
    frames = bytearray()
    for i in range(N):
        t = i / RATE
        left = right = 0.0
        for j, f in enumerate(freqs):
            breath = .72 + .28 * math.sin(TAU * t / SECONDS + j * .9)
            tone = (math.sin(TAU * f * t + j) + .13 * math.sin(TAU * 2 * f * t + .4)) * .035 * breath
            left += tone * (.75 + .2 * math.sin(j))
            right += tone * (.75 + .2 * math.cos(j))
        for onset, f in bells:
            age = (t - onset) % SECONDS
            envelope = (1 - math.exp(-age / 1.8)) * math.exp(-age / 4.2)
            tone = .028 * envelope * math.sin(TAU * round(f * SECONDS) / SECONDS * t)
            left += tone
            right += tone * .8
        air = sum(a * math.sin(TAU * k * t / SECONDS + phase) for a, k, phase in wind)
        left += air
        right += air * .85
        frames.extend(struct.pack('<hh', round(left * 32767), round(right * 32767)))
    wav.writeframes(frames)
print(output)
