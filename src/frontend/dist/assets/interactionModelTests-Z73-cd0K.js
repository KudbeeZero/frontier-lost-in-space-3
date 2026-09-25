import { I as InteractionState, a as InteractionFSM, i as interactionBus } from "./index-u3SnnrTV.js";
function runPath(fsm, path, steps) {
  const stepLabels = [];
  for (const step of steps) {
    const ok = fsm.transition(step.to, step.reason);
    const label = `${step.to}(${ok ? "ok" : "blocked"})`;
    stepLabels.push(label);
    if (ok !== step.expectSuccess) {
      return {
        path,
        steps: stepLabels,
        pass: false,
        failAt: step.to,
        reason: `Expected transition to ${step.to} to ${step.expectSuccess ? "succeed" : "be blocked"} but got ${ok ? "success" : "blocked"}`
      };
    }
  }
  return { path, steps: stepLabels, pass: true };
}
function runInteractionModelTests() {
  const results = [];
  {
    const fsm = new InteractionFSM();
    results.push(
      runPath(fsm, "tapLock", [
        {
          to: InteractionState.pointerDown,
          expectSuccess: true,
          reason: "pointer contact"
        },
        {
          to: InteractionState.tapCandidate,
          expectSuccess: true,
          reason: "held < threshold"
        },
        {
          to: InteractionState.targetLocked,
          expectSuccess: true,
          reason: "globe hit confirmed"
        }
      ])
    );
    fsm.reset();
  }
  {
    const fsm = new InteractionFSM();
    results.push(
      runPath(fsm, "dragRotate", [
        {
          to: InteractionState.pointerDown,
          expectSuccess: true,
          reason: "pointer contact"
        },
        {
          to: InteractionState.tapCandidate,
          expectSuccess: true,
          reason: "held < threshold"
        },
        {
          to: InteractionState.draggingGlobe,
          expectSuccess: true,
          reason: "moved > 8px"
        },
        {
          to: InteractionState.idle,
          expectSuccess: true,
          reason: "pointer up"
        }
      ])
    );
    fsm.reset();
  }
  {
    const fsm = new InteractionFSM();
    results.push(
      runPath(fsm, "tapOutsideGlobe", [
        {
          to: InteractionState.pointerDown,
          expectSuccess: true,
          reason: "pointer contact"
        },
        {
          to: InteractionState.tapCandidate,
          expectSuccess: true,
          reason: "held < threshold"
        },
        {
          to: InteractionState.idle,
          expectSuccess: true,
          reason: "no globe hit"
        }
      ])
    );
    fsm.reset();
  }
  {
    const fsm = new InteractionFSM();
    results.push(
      runPath(fsm, "joystickWhileIdle", [
        {
          to: InteractionState.joystickActive,
          expectSuccess: true,
          reason: "joystick > deadzone"
        },
        {
          to: InteractionState.idle,
          expectSuccess: true,
          reason: "joystick neutral"
        }
      ])
    );
    fsm.reset();
  }
  {
    const fsm = new InteractionFSM();
    results.push(
      runPath(fsm, "joystickDuringLock", [
        {
          to: InteractionState.pointerDown,
          expectSuccess: true,
          reason: "pointer contact"
        },
        {
          to: InteractionState.tapCandidate,
          expectSuccess: true,
          reason: "held < threshold"
        },
        {
          to: InteractionState.targetLocked,
          expectSuccess: true,
          reason: "globe hit confirmed"
        },
        {
          to: InteractionState.joystickActive,
          expectSuccess: true,
          reason: "joystick moved while locked"
        }
      ])
    );
    fsm.reset();
  }
  {
    const fsm = new InteractionFSM();
    results.push(
      runPath(fsm, "rapidTapDrag", [
        {
          to: InteractionState.pointerDown,
          expectSuccess: true,
          reason: "pointer contact"
        },
        // pointerDown → draggingGlobe IS in TRANSITION_TABLE so this should succeed
        {
          to: InteractionState.draggingGlobe,
          expectSuccess: true,
          reason: "rapid movement > threshold"
        },
        {
          to: InteractionState.idle,
          expectSuccess: true,
          reason: "pointer up"
        }
      ])
    );
    fsm.reset();
  }
  {
    let caught = false;
    const unsub = interactionBus.subscribe((e) => {
      if (e.type === "illegalInputInterception") caught = true;
    });
    interactionBus.emit({
      type: "illegalInputInterception",
      source: "test-overlay",
      data: { reason: "test: overlay intercepted pointer-events" }
    });
    unsub();
    results.push({
      path: "overlayInterception",
      steps: ["emit(illegalInputInterception)", `caught=${caught}`],
      pass: caught,
      failAt: caught ? void 0 : "illegalInputInterception",
      reason: caught ? void 0 : "Bus did not deliver illegalInputInterception event"
    });
  }
  return results;
}
export {
  runInteractionModelTests
};
