# Chrome extension -- Rebrowse

## Tech architecture
- overall
![Screenshot 2025-06-02 at 11 30 39 PM](https://github.com/user-attachments/assets/0480f653-7c48-4069-9c18-88a5c59cc984)

### UI arc

1. Chrome Extension UI (e.g., popup.html):
  - Primary Role: Quick, in-context actions related to the active browser tab.
  - Functionality:
    - "Start Recording" button: Sends a message to background.js, which in turn will send a native message to host.py to initiate recording for the active tab.
    - "Stop Recording" button: Similarly, tells host.py via background.js to stop recording and save the trace.
  - Status: Could show very basic status like "Recording" / "Idle" / "Error". This status would likely be pushed from host.py back to background.js and then to the popup.

2. Gradio UI (webui.py):
  - Primary Role: More comprehensive trace management, replay functionality, detailed status display, and configuration.
  - Functionality:
    - Trace Management: Listing, selecting trace files (as you currently have).
    - Replay: Initiating and controlling the replay of selected traces (as you currently have).
    - Detailed Status/Logs: Displaying logs and status updates originating from host.py (e.g., "Connected to browser," "CDP event received," "Recording started/stopped," errors from the native host). This is a key part of our minimal release.
    - Configuration: (Future) Settings related to recording, replay, etc.

### Process Sequence  

1. Triggering a trace from Gradio and replaying
  - NamePipe: a Streaming method of inter-process communication (IPC) that allows processes to communicate through a shared memory buffer.
    `host.py`(one-writer) adn `webui.py`(one-reader) is connected with namepipe.
  - multi-thread expansion:  
![Screenshot 2025-06-03 at 6 54 50 PM](https://github.com/user-attachments/assets/39c0f0a3-1680-4c69-a827-531b32384da6)

  | Step                     | Detail        |                                                                                                                                                                                                    
  | ------------------------ | ------------------------ |
  | 1. Gradio action         | The “Replay” button in `webui.py` calls an async function that writes a JSON command to the **FIFO** or hits a tiny HTTP endpoint exposed by `host.py`.                                                                                                                                                                                                          |
  | 2. Native host picks tab | Because the extension already sent the active `tabId` when it started recording, `host.py` can resolve “same tab” by that ID or ask `background.js` for the current active tab if none recorded.                                                                                                                                                                 |
  | 3. Native-message bridge | `host.py` sends `{cmd:"replay", trace:<array_of_steps>, tabId}` via `stdout`.  `background.js` receives it in `chrome.runtime.onMessageExternal`.                                                                                                                                                                                                                |
  | 4. Replay driver         | The **simplest path** is for `background.js` to loop over the JSONL entries and translate each into a CDP call with `chrome.debugger.sendCommand`— ⚠️no Playwright needed for replay.  If you already have a Playwright “replayer” written, run it inside `host.py` *connected to the same Chrome instance* (`chromium.connect_over_cdp("http://localhost:9222")`). |
  | 5. Status back-flow      | After each step, `background.js` posts `{"phase":"replay","step":n}` back to `host.py`, which writes “Replay 35 %” into the FIFO, so Gradio’s textbox autoscrolls.        |                                                                                                                  
