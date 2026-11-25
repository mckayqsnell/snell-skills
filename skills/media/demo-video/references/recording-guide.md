# How to record a demo you talk through

Show this to the user when they ask how to record one, or before they record. Keep it to what fits their tool.

## Before you record

- **Use demo data.** No real customers, keys or tokens on screen. Close email, chat and anything with notifications (Do Not Disturb on).
- **One screen at 1920×1080**, the browser zoomed to 110–125% so text reads on a phone. Hide bookmarks and extra tabs.
- **Sound:** a headset or a mic close to you beats a laptop mic across the desk. A soft room (curtains, a sofa) beats a bare one. Record a 5-second test and listen.
- **Know your three points.** You don't need a script: know the one thing the viewer should remember and the 2–3 moments that show it.

## Pick a tool

| Tool | Set it up like this |
|---|---|
| **OBS** (free, any OS) | Settings → Output → Recording: MKV (a crash doesn't lose the file), 60 fps, constant frame rate. Put the webcam in a corner as a Video Capture source. For a separate webcam file, add the Source Record plugin to the webcam source. |
| **Loom** | Screen and camera, full screen. Download the MP4 when done. The face is baked in, which is fine. |
| **Cap** (free, Mac and Windows) | Studio mode. The project folder keeps the screen and `camera.mp4` apart; give the agent both. |
| **Screen Studio** (Mac) | Export, or "Extract raw recording files" to keep the camera apart. |
| **QuickTime** (Mac) | File → New Screen Recording, with the mic on. No webcam: fine for a voice-only demo. |

## While you record

- Talk to one person, as if they sat next to you. Normal pace.
- **Pause for a breath between points.** The cut can only join where you pause.
- **Made a mistake? Say "cut that",** pause, and start the sentence again. The agent finds those and drops the bad try.
- During a wait (a build, a page loading) stay quiet or say what's happening; the wait gets sped up.
- Long is fine. Ten minutes in a few takes is normal; the agent finds the best minute or two.

## After

Put the takes in one folder and tell the agent: `/demo-video ~/Videos/my-demo` (or name the files). It transcribes them on your machine, asks you a few questions, shows you a cut plan to approve, then makes the video. Nothing is uploaded.
