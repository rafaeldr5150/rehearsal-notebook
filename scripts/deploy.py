"""Deploy public/ to Vercel through the REST API.

Usage: VERCEL_TOKEN=... python3 scripts/deploy.py <project-name>
Run `python3 build.py` first.
"""
import base64, json, os, sys, urllib.request

root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public")
name = sys.argv[1] if len(sys.argv) > 1 else "rehearsal-notebook"
files = [
    {"file": f, "data": base64.b64encode(open(os.path.join(root, f), "rb").read()).decode(), "encoding": "base64"}
    for f in sorted(os.listdir(root))
]
body = {"name": name, "target": "production", "files": files,
        "projectSettings": {"framework": None, "buildCommand": None, "outputDirectory": None, "installCommand": None}}
req = urllib.request.Request(
    "https://api.vercel.com/v13/deployments?forceNew=1",
    data=json.dumps(body).encode(),
    headers={"Authorization": "Bearer " + os.environ["VERCEL_TOKEN"], "Content-Type": "application/json"},
)
res = json.load(urllib.request.urlopen(req))
print(res["id"], res.get("url"), res.get("readyState"))
