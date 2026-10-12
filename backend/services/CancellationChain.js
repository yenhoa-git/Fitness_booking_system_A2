const CANCELLATION_CUTOFF_HOURS = 2;
const CANCELLATION_CUTOFF_MS = CANCELLATION_CUTOFF_HOURS * 60 * 60 * 1000;

class CancellationHandler {
  setNext(handler) {
    this.next = handler;
    return handler;
  }

  handle(context) {
    return this.next ? this.next.handle(context) : null;
  }
}

class ClassStartedHandler extends CancellationHandler {
  handle(context) {
    const { classDate, now } = context;
    if (new Date(classDate).getTime() <= now.getTime()) {
      return {
        status: 400,
        message: "Bookings cannot be cancelled after the class has started",
      };
    }
    return super.handle(context);
  }
}

class TwoHourCutoffHandler extends CancellationHandler {
  handle(context) {
    const { classDate, now } = context;
    if (
      new Date(classDate).getTime() - now.getTime() <
      CANCELLATION_CUTOFF_MS
    ) {
      return {
        status: 400,
        message: `Bookings cannot be cancelled within ${CANCELLATION_CUTOFF_HOURS} hours of the class start time`,
      };
    }
    return super.handle(context);
  }
}

const checkCancellation = (classDate, now = new Date()) => {
  const first = new ClassStartedHandler();
  first.setNext(new TwoHourCutoffHandler());
  return first.handle({ classDate, now: new Date(now) });
};

module.exports = {
  CANCELLATION_CUTOFF_HOURS,
  CancellationHandler,
  ClassStartedHandler,
  TwoHourCutoffHandler,
  checkCancellation,
};
