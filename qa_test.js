const fs = require('fs');
global.window = {};
eval(fs.readFileSync('client/assets/engine.js', 'utf8'));
const Engine = window.Engine;

Engine.seed();

function log(msg) { console.log(msg); }

try {
  // Test 1: Mark CALLED -> NO_SHOW -> RECALL -> becomes CALLED
  log("Test 1: Normal recall");
  let t1 = Engine.getState().tokens.find(t => t.status === "CALLED");
  Engine.noShow(t1.id);
  
  // Counters are now free for this service, so recall should succeed
  let recalled = Engine.recall(t1.id);
  if (recalled.status === "CALLED" && recalled.recallCount === 1) {
    log("PASS: Token became CALLED, recallCount=1");
  } else {
    log("FAIL: Status=" + recalled.status + ", recallCount=" + recalled.recallCount);
  }

  // Test 2: Recall twice -> should throw
  log("Test 2: Double recall limit");
  Engine.noShow(recalled.id);
  try {
    Engine.recall(recalled.id);
    log("FAIL: Should have thrown");
  } catch(e) {
    if (e.message.includes("already been recalled once")) log("PASS: " + e.message);
    else log("FAIL: Wrong message: " + e.message);
  }

  // Test 3: Recall expired (mock time)
  log("Test 3: Recall expired");
  Engine.takeToken({ serviceId: "svc-001", phone: "1234567890", consentGiven: false });
  // Need to call it first to free a counter, or rather, wait.
  // Actually, we just need to test the time expiration. We can manually hack the object.
  let t3 = Engine.takeToken({ serviceId: "svc-001", phone: "1231231233", consentGiven: false });
  t3.status = "NO_SHOW";
  t3.noShowAt = new Date(Date.now() - 61000);
  Engine.getState().tokens.find(x => x.id === t3.id).status = "NO_SHOW";
  Engine.getState().tokens.find(x => x.id === t3.id).noShowAt = new Date(Date.now() - 61000);
  
  try {
    Engine.recall(t3.id);
    log("FAIL: Should have thrown expired");
  } catch(e) {
    if (e.message.includes("expired")) log("PASS: " + e.message);
    else log("FAIL: Wrong message: " + e.message);
  }

  // Test 4: Recall when busy
  log("Test 4: Counters busy");
  // The first token in svc-001 is CALLED (it was re-CALLED in Test 1).
  // So the 1 counter for svc-001 is busy.
  // Fill up counters for svc-001 (activeCounters: 2)
  Engine.getState().tokens.filter(t => t.serviceId === "svc-001" && t.status === "ISSUED").slice(0, 2).forEach(t => {
    t.status = "CALLED";
  });

  let t4 = Engine.takeToken({ serviceId: "svc-001", phone: "9999999999", consentGiven: false });
  Engine.getState().tokens.find(x => x.id === t4.id).status = "NO_SHOW";
  Engine.getState().tokens.find(x => x.id === t4.id).noShowAt = new Date();
  
  let q = Engine.getQueue("svc-001");
  let calledCount = q.filter(x => x.status === "CALLED").length;
  let svc = Engine.getState().services.find(s => s.id === "svc-001");
  log("Before Test 4 - calledCount: " + calledCount + ", counters: " + svc.counters + ", activeCounters: " + svc.activeCounters);

  try {
    Engine.recall(t4.id);
    log("FAIL: Should have thrown busy");
  } catch(e) {
    if (e.message.includes("counters are busy")) log("PASS: " + e.message);
    else log("FAIL: Wrong message: " + e.message);
  }

} catch(e) {
  log("FATAL ERROR: " + e.message);
}
