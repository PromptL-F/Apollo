from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

root = Path(__file__).resolve().parents[1] / "assets/images"
root.mkdir(parents=True, exist_ok=True)
BG = (7, 10, 9, 255)
AMBER = (243, 181, 98, 255)
DIM = (116, 83, 49, 255)

def make(path, size, with_wordmark=False):
    image = Image.new("RGBA", (size, size), BG)
    draw = ImageDraw.Draw(image)
    cx = cy = size // 2
    r = int(size * 0.27)
    draw.ellipse((cx-r, cy-r, cx+r, cy+r), outline=AMBER, width=max(2, size//64))
    draw.arc((cx-int(r*1.35), cy-int(r*.55), cx+int(r*1.35), cy+int(r*.55)), 200, 340, fill=AMBER, width=max(2,size//64))
    draw.arc((cx-int(r*1.35), cy-int(r*.55), cx+int(r*1.35), cy+int(r*.55)), 20, 160, fill=DIM, width=max(2,size//64))
    core = int(size * .045)
    draw.ellipse((cx-core, cy-core, cx+core, cy+core), fill=AMBER)
    if with_wordmark:
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf", int(size*.075))
        except OSError:
            font = None
        text = "APOLLO"
        box = draw.textbbox((0,0), text, font=font)
        draw.text((cx-(box[2]-box[0])/2, int(size*.68)), text, fill=AMBER, font=font)
    image.save(path)

make(root / "icon.png", 1024, True)
make(root / "splash-icon.png", 1024, False)
make(root / "android-icon-foreground.png", 1024, False)
make(root / "android-icon-monochrome.png", 1024, False)
Image.new("RGBA", (1024, 1024), BG).save(root / "android-icon-background.png")
Image.new("RGBA", (512, 512), BG).save(root / "favicon.png")
