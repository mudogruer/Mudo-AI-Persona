from PIL import Image
import json
import os

def extract_points(image_path):
    if not os.path.exists(image_path):
        print("Image not found")
        return

    img = Image.open(image_path)
    
    # Resize to control density
    # Keep it manageable (around 3000-4000 points max usually)
    target_width = 120 
    aspect_ratio = img.height / img.width
    target_height = int(target_width * aspect_ratio)
    
    img = img.resize((target_width, target_height))
    img_gray = img.convert('L')
    
    width, height = img.size
    points = []
    
    # Use max dimension for normalization to preserve aspect ratio
    max_dim = max(width, height)
    
    # Iterate pixels
    for y in range(height):
        for x in range(width):
            brightness = img_gray.getpixel((x, y))
            # Threshold: only take bright pixels (edges/lines)
            if brightness > 50: 
                # Centered and normalized preserving aspect ratio
                norm_x = (x - width / 2) / max_dim
                norm_y = (y - height / 2) / max_dim
                # Invert Y because canvas Y is down, but image Y is down too... 
                # actually 0,0 is top-left in both. 
                # standard cartesian would invert Y, but for screen coords (y down), this is fine.
                
                points.append([round(norm_x, 4), round(norm_y, 4)])

    # Write directly to file to avoid encoding issues with shell redirection
    output_path = os.path.join('mudo-frontend', 'face_points.json')
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(points, f)
        print(f"Successfully wrote {len(points)} points to {output_path}")
    except Exception as e:
        print(f"Error writing file: {e}")

if __name__ == "__main__":
    extract_points("image.png")
