# mamont1k.me

Static personal portfolio, published with GitHub Pages. No build or runtime dependencies.

## Local artwork and sound

- `assets/night-landscape.svg`: original vector artwork created for this site: layered mountain ridges, lake, pine silhouettes. Moon and slow fog are CSS; all visual motion stops with `prefers-reduced-motion`.
- `assets/blue-hour.mp3`: original synthesized 48-second ambient composition created for this site, not a borrowed/licensed commercial track. Soft D-minor/suspended pads, slow bell notes, and quiet wind texture. No third-party samples, recordings, or melodies. The generated audio and landscape artwork may be used, modified, and redistributed with this site without attribution requirements. No external audio license is required.
- `generate_audio.py` is the reproducible Python-stdlib synthesis source. Oscillators use loop-aligned frequencies and periodic envelopes. MP3 encoder delay/padding is handled by gapless-aware players; other players may leave a small loop gap.

Regenerate music (Python 3 and ffmpeg required):

```sh
python3 generate_audio.py
ffmpeg -y -i /tmp/mamont1k-blue-hour.wav -codec:a libmp3lame -b:a 96k -ar 24000 assets/blue-hour.mp3
```

Music loads only after entry; initial volume is 25%, with accessible play/pause and volume controls. Track title is intentionally not shown.

## Checks

```sh
node test.cjs
LD_LIBRARY_PATH=/home/itai/lib node test.cjs /home/itai/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
```

Checks cover syntax, exact project and social links, entry isolation, keyboard and rapid tab switching, touch targets, horizontal overflow, and reduced motion at 375×667, 375×900, and 1024×900.
