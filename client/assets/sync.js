(function(window) {
  var bc = null;
  var tabId = sessionStorage.getItem("ql_tab_id");
  if (!tabId) {
    tabId = "tab_" + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem("ql_tab_id", tabId);
  }

  var onSnapshotCallback = null;
  var lastPublishMs = 0;
  var publishTimer = null;

  function initSync(opts) {
    onSnapshotCallback = opts.onSnapshot;

    try {
      if (typeof BroadcastChannel !== "undefined") {
        bc = new BroadcastChannel("ql_sync_v1");
        bc.onmessage = function(ev) {
          if (ev.data && ev.data.type === "SNAPSHOT" && onSnapshotCallback) {
            onSnapshotCallback(ev.data.payload);
          } else if (ev.data && ev.data.type === "REQ_SNAPSHOT") {
            // we could broadcast current snapshot here, but localStorage handles initial load well enough
          }
        };
      }
    } catch (e) {
      console.warn("BroadcastChannel not supported/allowed.", e);
    }

    window.addEventListener("storage", function(ev) {
      if (ev.key === "ql_sync_snapshot_v1" && ev.newValue) {
        try {
          var data = JSON.parse(ev.newValue);
          if (data && data.type === "SNAPSHOT" && onSnapshotCallback && data.from !== tabId) {
            onSnapshotCallback(data.payload);
          }
        } catch (e) {
          console.error("Failed to parse sync snapshot", e);
        }
      }
    });
  }

  function doPublish(payload) {
    var data = {
      type: "SNAPSHOT",
      v: 1,
      at: Date.now(),
      from: tabId,
      payload: payload
    };

    if (bc) {
      bc.postMessage(data);
    }
    try {
      localStorage.setItem("ql_sync_snapshot_v1", JSON.stringify(data));
    } catch (e) {
      console.warn("localStorage write failed", e);
    }
  }

  function publishSnapshot(payload) {
    var now = Date.now();
    // throttle to max 5/sec (200ms)
    if (now - lastPublishMs > 200) {
      if (publishTimer) { clearTimeout(publishTimer); publishTimer = null; }
      lastPublishMs = now;
      doPublish(payload);
    } else {
      if (publishTimer) clearTimeout(publishTimer);
      publishTimer = setTimeout(function() {
        lastPublishMs = Date.now();
        doPublish(payload);
      }, 200);
    }
  }

  function requestSnapshot() {
    if (bc) {
      bc.postMessage({ type: "REQ_SNAPSHOT", from: tabId });
    }
    // Read fallback immediately
    try {
      var val = localStorage.getItem("ql_sync_snapshot_v1");
      if (val) {
        var data = JSON.parse(val);
        if (data && data.type === "SNAPSHOT" && onSnapshotCallback) {
          onSnapshotCallback(data.payload);
        }
      }
    } catch (e) {
      // ignore
    }
  }

  window.qlSync = {
    init: initSync,
    publish: publishSnapshot,
    request: requestSnapshot
  };
})(window);
