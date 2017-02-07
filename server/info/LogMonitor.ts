import * as Rx from "rx";
import * as Tail from "always-tail";

export module LogMonitor {
    export function create(filePath: string) {
        return Rx.Observable.create(function (observer) {
            let tail = new Tail(filePath, '\n', { start: 0 });
            tail.on('line', function(data) {
                observer.onNext(data);
            });
            tail.on('error', function(err) {
                console.error(err + '\n' + err.stack);
                observer.onError(err);
            });

            tail.watch();
            console.log('Watching ' + filePath);

            return function () {
                    if (tail !== undefined) {
                            tail.unwatch();
                            tail = undefined;
                    }
            };
        });
    }
}