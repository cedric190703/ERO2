export class Student {
    constructor(id, type, arrivalTime) {
        this.id = id;
        this.type = type; // "ING", "PREPA", or "Standard"
        this.arrivalTime = arrivalTime;
        this.status = "Arrived";
        this.x = 100;
        this.y = 337.5;
        this.targetX = 100;
        this.targetY = 337.5;
        this.completionTime = null;
        this.removeAfter = null; // Time after which to remove
    }

    updatePosition(speed = 5) {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 1) {
            this.x += (dx / dist) * speed;
            this.y += (dy / dist) * speed;
        } else {
            this.x = this.targetX;
            this.y = this.targetY;
        }
    }
}

export class SimulationEngine {
    constructor(config) {
        this.config = config;
        this.time = 0;
        this.paused = false;
        this.students = [];
        this.execQueue = [];
        this.resultQueue = [];
        this.execServers = [];
        this.resultServers = [];

        this.stats = {
            completed: 0,
            rejected: 0,
            rejectedExec: 0,
            rejectedResult: 0,
            totalWaitTime: 0,
            waitTimes: [],
            popStats: {}
        };

        this.history = {
            time: [],
            execQueue: [],
            resultQueue: [],
            utilization: []
        };

        // Layout cache
        this.layout = null;

        this.init();
    }

    init() {
        this.execServers = [];
        this.resultServers = [];

        for (let i = 0; i < this.config.numExecServers; i++) {
            this.execServers.push({ id: i, status: "free", currentStudent: null, remainingTime: 0 });
        }
        for (let i = 0; i < this.config.numResultServers; i++) {
            this.resultServers.push({ id: i, status: "free", currentStudent: null, remainingTime: 0 });
        }

        const populations = this.config.scenario === "Waterfall"
            ? ["Standard"]
            : ["ING", "PREPA"];

        populations.forEach(pop => {
            this.stats.popStats[pop] = {
                completed: 0,
                rejected: 0,
                totalWaitTime: 0,
                waitTimes: []
            };
        });

        // Initialize layout
        this.updateLayout();
    }

    updateLayout() {
        const W = 1200;
        const H = 675;
        const margin = 100;
        const centerY = H / 2;

        const sourceX = margin;
        const execQueueX = margin + 180;
        const execServerX = W / 2 - 100;
        const resultQueueX = W / 2 + 100;
        const resultServerX = W - margin - 180;

        const numExecServers = this.config.numExecServers;
        const execServers = [];
        const execSpacing = Math.min(80, 300 / numExecServers);
        for (let i = 0; i < numExecServers; i++) {
            execServers.push({
                x: execServerX,
                y: centerY - ((numExecServers - 1) * execSpacing) / 2 + i * execSpacing
            });
        }

        const numResultServers = this.config.numResultServers;
        const resultServers = [];
        const resultSpacing = Math.min(80, 300 / numResultServers);
        for (let i = 0; i < numResultServers; i++) {
            resultServers.push({
                x: resultServerX,
                y: centerY - ((numResultServers - 1) * resultSpacing) / 2 + i * resultSpacing
            });
        }

        this.layout = {
            source: { x: sourceX, y: centerY },
            execQueue: { x: execQueueX, y: centerY },
            execServers,
            resultQueue: { x: resultQueueX, y: centerY },
            resultServers,
            exitY: H + 100 // Below canvas for removal
        };
    }

    update(dt) {
        if (this.paused) return;

        this.time += dt;

        this.handleArrivals(dt);
        this.handleExecution(dt);
        this.handleResults(dt);
        this.updateStudentPositions(dt);
        this.cleanupStudents();
        this.recordHistory();
    }

    handleArrivals(dt) {
        const populations = this.config.scenario === "Waterfall"
            ? [{ name: "Standard", rate: this.config.arrivalRate }]
            : [
                { name: "ING", rate: this.config.ingRate },
                { name: "PREPA", rate: this.config.prepaRate }
            ];

        populations.forEach(pop => {
            if (Math.random() < pop.rate * (dt / 1000)) {
                const student = new Student(
                    this.students.length + 1,
                    pop.name,
                    this.time
                );
                student.x = this.layout.source.x;
                student.y = this.layout.source.y;
                this.students.push(student);

                if (this.config.execQueueCap === Infinity || this.execQueue.length < this.config.execQueueCap) {
                    student.status = "Queued_Exec";
                    this.execQueue.push(student);
                    student.targetX = this.layout.execQueue.x;
                    student.targetY = this.layout.execQueue.y;
                } else {
                    student.status = "Rejected_Exec";
                    this.stats.rejected++;
                    this.stats.rejectedExec++;
                    this.stats.popStats[pop.name].rejected++;
                    student.targetX = this.layout.execQueue.x;
                    student.targetY = this.layout.exitY; // Move down to exit
                    student.removeAfter = this.time + 2000; // Remove after 2s
                }
            }
        });
    }

    handleExecution(dt) {
        this.execServers.forEach((server, idx) => {
            if (server.status === "free" && this.execQueue.length > 0) {
                if (this.config.damEnabled && this.config.scenario === "Channels") {
                    const cycle = this.config.damBlockTime + this.config.damOpenTime;
                    const phase = (this.time / 1000) % cycle;
                    if (phase < this.config.damBlockTime) {
                        return;
                    }
                }

                const student = this.execQueue.shift();
                server.status = "busy";
                server.currentStudent = student;
                student.status = "Executing";

                let execTime = this.config.avgExecTime;
                if (this.config.scenario === "Channels") {
                    execTime = student.type === "ING" ? this.config.ingExecTime : this.config.prepaExecTime;
                }
                server.remainingTime = -Math.log(Math.random()) * execTime * 1000;

                student.targetX = this.layout.execServers[idx].x;
                student.targetY = this.layout.execServers[idx].y;
            }

            if (server.status === "busy") {
                server.remainingTime -= dt;
                if (server.remainingTime <= 0) {
                    const student = server.currentStudent;
                    server.status = "free";
                    server.currentStudent = null;

                    let saved = false;
                    if (this.config.backupProb > 0 && Math.random() < this.config.backupProb) {
                        saved = true;
                    }

                    if (this.config.resultQueueCap === Infinity || this.resultQueue.length < this.config.resultQueueCap) {
                        student.status = "Queued_Result";
                        this.resultQueue.push(student);
                        student.targetX = this.layout.resultQueue.x;
                        student.targetY = this.layout.resultQueue.y;
                    } else {
                        if (saved) {
                            student.status = "Saved_By_Backup";
                            student.completionTime = this.time;
                            this.recordCompletion(student);
                            student.targetX = this.layout.resultQueue.x;
                            student.targetY = this.layout.exitY;
                            student.removeAfter = this.time + 2000;
                        } else {
                            student.status = "Rejected_Result";
                            this.stats.rejected++;
                            this.stats.rejectedResult++;
                            this.stats.popStats[student.type].rejected++;
                            student.targetX = this.layout.resultQueue.x;
                            student.targetY = this.layout.exitY;
                            student.removeAfter = this.time + 2000;
                        }
                    }
                }
            }
        });
    }

    handleResults(dt) {
        this.resultServers.forEach((server, idx) => {
            if (server.status === "free" && this.resultQueue.length > 0) {
                const student = this.resultQueue.shift();
                server.status = "busy";
                server.currentStudent = student;
                student.status = "Resulting";

                server.remainingTime = -Math.log(Math.random()) * this.config.avgResultTime * 1000;

                student.targetX = this.layout.resultServers[idx].x;
                student.targetY = this.layout.resultServers[idx].y;
            }

            if (server.status === "busy") {
                server.remainingTime -= dt;
                if (server.remainingTime <= 0) {
                    const student = server.currentStudent;
                    server.status = "free";
                    server.currentStudent = null;
                    student.status = "Done";
                    student.completionTime = this.time;
                    student.targetX = this.layout.resultServers[idx].x + 100;
                    student.targetY = this.layout.exitY; // Exit downward
                    student.removeAfter = this.time + 2000; // Remove after 2s

                    this.recordCompletion(student);
                }
            }
        });
    }

    recordCompletion(student) {
        this.stats.completed++;
        const waitTime = student.completionTime - student.arrivalTime;
        this.stats.totalWaitTime += waitTime;
        this.stats.waitTimes.push(waitTime);

        this.stats.popStats[student.type].completed++;
        this.stats.popStats[student.type].totalWaitTime += waitTime;
        this.stats.popStats[student.type].waitTimes.push(waitTime);
    }

    updateStudentPositions(dt) {
        const speed = 5 * (this.config.speed || 1);
        this.students.forEach(s => {
            s.updatePosition(speed);
        });
    }

    cleanupStudents() {
        // Remove students that are past their removal time
        this.students = this.students.filter(s => {
            return !s.removeAfter || this.time < s.removeAfter;
        });
    }

    recordHistory() {
        if (this.time % 1000 < 50) {
            this.history.time.push(this.time / 1000);
            this.history.execQueue.push(this.execQueue.length);
            this.history.resultQueue.push(this.resultQueue.length);

            const busyExec = this.execServers.filter(s => s.status === "busy").length;
            const utilization = busyExec / this.execServers.length;
            this.history.utilization.push(utilization * 100);
        }
    }

    getVariance() {
        if (this.stats.waitTimes.length < 2) return 0;
        const mean = this.stats.totalWaitTime / this.stats.completed;
        const sumSquaredDiff = this.stats.waitTimes.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0);
        return sumSquaredDiff / this.stats.waitTimes.length;
    }

    reset() {
        this.time = 0;
        this.students = [];
        this.execQueue = [];
        this.resultQueue = [];
        this.stats = {
            completed: 0,
            rejected: 0,
            rejectedExec: 0,
            rejectedResult: 0,
            totalWaitTime: 0,
            waitTimes: [],
            popStats: {}
        };
        this.history = {
            time: [],
            execQueue: [],
            resultQueue: [],
            utilization: []
        };
        this.init();
    }

    togglePause() {
        this.paused = !this.paused;
    }
}
