(function () {
    const STORAGE_KEY = "ewaste_live_state";
    const STATE_VERSION = 2;

    // Mirrors Java src status progression in WasteRequest.Status
    const REQUEST_STATUS_FLOW = ["SUBMITTED", "SCHEDULED", "IN_TRANSIT", "COMPLETED", "CANCELLED"];

    const defaultState = {
        stateVersion: STATE_VERSION,
        requestId: null,
        requestStatus: null,
        requestCounter: 1200,
        notificationCounter: 0,
        recyclers: {
            GreenTech: "Pending",
            EcoCycle: "Pending",
            RecycleHub: "Pending"
        },
        activityLog: [],
        notifications: {
            user: [],
            admin: []
        }
    };

    function loadState() {
        try {
            const existing = localStorage.getItem(STORAGE_KEY);
            if (!existing) {
                return { ...defaultState };
            }
            const parsed = JSON.parse(existing);
            const hydrated = {
                ...defaultState,
                ...parsed,
                recyclers: { ...defaultState.recyclers, ...(parsed.recyclers || {}) },
                activityLog: Array.isArray(parsed.activityLog) ? parsed.activityLog : [],
                notifications: {
                    user: Array.isArray(parsed.notifications && parsed.notifications.user)
                        ? parsed.notifications.user
                        : [],
                    admin: Array.isArray(parsed.notifications && parsed.notifications.admin)
                        ? parsed.notifications.admin
                        : []
                }
            };

            // One-time state migration: return all approval entries to Pending.
            if (parsed.stateVersion !== STATE_VERSION) {
                hydrated.recyclers = { ...defaultState.recyclers };
                hydrated.stateVersion = STATE_VERSION;
            }

            return hydrated;
        } catch (err) {
            return { ...defaultState };
        }
    }

    function saveState(state) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    function addActivity(state, line) {
        state.activityLog.unshift(new Date().toLocaleTimeString() + " - " + line);
        if (state.activityLog.length > 8) {
            state.activityLog = state.activityLog.slice(0, 8);
        }
    }

    function addNotification(state, audience, message) {
        if (!state.notifications || !Array.isArray(state.notifications[audience])) {
            return;
        }

        state.notificationCounter += 1;
        state.notifications[audience].unshift({
            id: state.notificationCounter,
            message: message,
            time: new Date().toLocaleTimeString(),
            read: false
        });

        if (state.notifications[audience].length > 20) {
            state.notifications[audience] = state.notifications[audience].slice(0, 20);
        }
    }

    function markAllRead(state, audience) {
        if (!state.notifications || !Array.isArray(state.notifications[audience])) {
            return;
        }
        state.notifications[audience] = state.notifications[audience].map(function (item) {
            return { ...item, read: true };
        });
    }

    function markAllUnread(state, audience) {
        if (!state.notifications || !Array.isArray(state.notifications[audience])) {
            return;
        }
        state.notifications[audience] = state.notifications[audience].map(function (item) {
            return { ...item, read: false };
        });
    }

    function unreadCount(state, audience) {
        if (!state.notifications || !Array.isArray(state.notifications[audience])) {
            return 0;
        }
        return state.notifications[audience].filter(function (item) {
            return !item.read;
        }).length;
    }

    function deriveStatusFromWorkflow(state) {
        if (!state.requestId) {
            return null;
        }
        if (state.requestStatus === "CANCELLED") {
            return "CANCELLED";
        }

        const recyclerStates = Object.values(state.recyclers || {});
        const hasCollected = recyclerStates.includes("Collected");
        const hasApproved = recyclerStates.includes("Approved") || hasCollected;
        const hasValidated = recyclerStates.includes("Validated") || hasApproved;

        if (hasCollected) {
            return "COMPLETED";
        }
        if (hasApproved) {
            return "IN_TRANSIT";
        }
        if (hasValidated) {
            return "SCHEDULED";
        }
        return "SUBMITTED";
    }

    function syncRequestStatus(state, withActivityLog) {
        const previous = state.requestStatus;
        const next = deriveStatusFromWorkflow(state);

        if (previous !== next) {
            state.requestStatus = next;
            if (withActivityLog && state.requestId && next) {
                addActivity(state, "Request " + state.requestId + " is now " + next + " by workflow.");
                addNotification(state, "user", "Request " + state.requestId + " status changed to " + next + ".");
                addNotification(state, "admin", "Workflow updated request " + state.requestId + " to " + next + ".");
            }
            return true;
        }
        return false;
    }

    function setupDashboard(state) {
        const requestForm = document.getElementById("waste-request-form");
        const requestIdText = document.getElementById("request-id");
        const requestStatusText = document.getElementById("request-status");
        const flowText = document.getElementById("status-flow");
        const removeBtn = document.getElementById("remove-request-btn");
        const userNotificationList = document.getElementById("user-notification-list");
        const userUnreadCount = document.getElementById("user-unread-count");
        const markUserReadBtn = document.getElementById("mark-user-read-btn");
        const markUserUnreadBtn = document.getElementById("mark-user-unread-btn");

        if (!requestForm || !requestIdText || !requestStatusText) {
            return;
        }

        function paintRequest() {
            syncRequestStatus(state, false);
            requestIdText.textContent = state.requestId || "No request yet";
            requestStatusText.textContent = state.requestStatus || "No active request";
            if (flowText) {
                flowText.textContent = "Source status flow: " + REQUEST_STATUS_FLOW.join(" -> ")
                    + " | auto-driven by admin/recycler actions.";
            }

            if (userNotificationList && userUnreadCount) {
                const list = state.notifications.user || [];
                userNotificationList.innerHTML = list.length
                    ? list
                        .map(function (item) {
                            return '<li class="' + (item.read ? '' : 'unread') + '">' + item.time + ' - ' + item.message + '</li>';
                        })
                        .join("")
                    : "<li>No notifications yet.</li>";
                userUnreadCount.textContent = unreadCount(state, "user") + " unread";
            }
        }

        requestForm.addEventListener("submit", function (event) {
            event.preventDefault();
            state.requestCounter += 1;
            state.requestId = "REQ-" + state.requestCounter;
            state.requestStatus = REQUEST_STATUS_FLOW[0];
            addActivity(state, "Request " + state.requestId + " submitted.");
            addNotification(state, "user", "Request " + state.requestId + " submitted successfully.");
            addNotification(state, "admin", "New request received: " + state.requestId + ".");
            syncRequestStatus(state, true);
            saveState(state);
            paintRequest();
        });

        removeBtn.addEventListener("click", function () {
            if (!state.requestStatus) {
                return;
            }
            state.requestStatus = "CANCELLED";
            addActivity(state, "Request " + state.requestId + " cancelled.");
            addNotification(state, "user", "Request " + state.requestId + " has been cancelled.");
            addNotification(state, "admin", "User cancelled request " + state.requestId + ".");
            saveState(state);
            paintRequest();
        });

        if (markUserReadBtn) {
            markUserReadBtn.addEventListener("click", function () {
                markAllRead(state, "user");
                saveState(state);
                paintRequest();
            });
        }

        if (markUserUnreadBtn) {
            markUserUnreadBtn.addEventListener("click", function () {
                markAllUnread(state, "user");
                saveState(state);
                paintRequest();
            });
        }

        window.addEventListener("storage", function () {
            const refreshed = loadState();
            Object.assign(state, refreshed);
            paintRequest();
        });

        const recyclerForm = document.getElementById("recycler-search-form");
        const recyclerResults = document.getElementById("recycler-results");
        if (recyclerForm && recyclerResults) {
            const recyclerData = [
                { name: "WEEE Centre", location: "Nairobi", rating: 4.5, type: "Household e-waste" },
                { name: "CFSK", location: "Nakuru", rating: 4.2, type: "Business e-waste" },
                { name: "EACR", location: "Kisumu", rating: 4.0, type: "Batteries and power units" }
            ];

            recyclerForm.addEventListener("submit", function (event) {
                event.preventDefault();
                const location = (document.getElementById("recycler-location").value || "").trim().toLowerCase();
                const type = document.getElementById("recycler-type").value;

                const matches = recyclerData.filter(function (row) {
                    const locationMatch = !location || row.location.toLowerCase().includes(location);
                    const typeMatch = type === "All recyclers" || row.type === type;
                    return locationMatch && typeMatch;
                });

                recyclerResults.innerHTML = matches.length
                    ? matches
                        .map(function (row) {
                            return "<li><strong>" + row.name + ":</strong> " + row.location + " | Rating " + row.rating + "</li>";
                        })
                        .join("")
                    : "<li>No certified recyclers match your search.</li>";
            });
        }

        paintRequest();
    }

    function setupAdmin(state) {
        const approvalItems = document.querySelectorAll(".approval-item");
        if (!approvalItems.length) {
            return;
        }

        const liveStatus = document.getElementById("admin-live-status");
        const logList = document.getElementById("admin-activity-log");
        const pendingCountBadge = document.getElementById("pending-approvals-count");
        const adminNotificationList = document.getElementById("admin-notification-list");
        const adminUnreadCount = document.getElementById("admin-unread-count");
        const markAdminReadBtn = document.getElementById("mark-admin-read-btn");
        const markAdminUnreadBtn = document.getElementById("mark-admin-unread-btn");

        function paintAdmin() {
            let pendingCount = 0;
            approvalItems.forEach(function (item) {
                const recyclerName = item.getAttribute("data-recycler");
                const statusBadge = item.querySelector(".recycler-status");
                const recyclerState = state.recyclers[recyclerName] || "Pending";

                // Items leave the Pending Approvals list once validated/approved.
                item.style.display = recyclerState === "Pending" ? "block" : "none";
                if (recyclerState === "Pending") {
                    pendingCount += 1;
                }

                if (statusBadge) {
                    statusBadge.textContent = recyclerState;
                }
            });

            if (pendingCountBadge) {
                pendingCountBadge.textContent = pendingCount + " pending";
            }

            if (liveStatus) {
                const counts = Object.values(state.recyclers).reduce(
                    function (acc, status) {
                        if (status === "Collected") {
                            acc.collected += 1;
                        } else if (status === "Approved") {
                            acc.approved += 1;
                        } else if (status === "Validated") {
                            acc.validated += 1;
                        } else {
                            acc.pending += 1;
                        }
                        return acc;
                    },
                    { approved: 0, validated: 0, collected: 0, pending: 0 }
                );
                liveStatus.textContent =
                    "Collected: " + counts.collected +
                    " | " +
                    "Approved: " + counts.approved +
                    " | Validated: " + counts.validated +
                    " | Pending: " + counts.pending;
            }

            if (logList) {
                logList.innerHTML = state.activityLog.length
                    ? state.activityLog.map(function (line) { return "<li>" + line + "</li>"; }).join("")
                    : "<li>No activity yet.</li>";
            }

            if (adminNotificationList && adminUnreadCount) {
                const list = state.notifications.admin || [];
                adminNotificationList.innerHTML = list.length
                    ? list
                        .map(function (item) {
                            return '<li class="' + (item.read ? '' : 'unread') + '">' + item.time + ' - ' + item.message + '</li>';
                        })
                        .join("")
                    : "<li>No notifications yet.</li>";
                adminUnreadCount.textContent = unreadCount(state, "admin") + " unread";
            }
        }

        approvalItems.forEach(function (item) {
            const recyclerName = item.getAttribute("data-recycler");
            const approveBtn = item.querySelector(".approve-btn");

            if (approveBtn) {
                approveBtn.addEventListener("click", function () {
                    state.recyclers[recyclerName] = "Approved";
                    addActivity(state, recyclerName + " approved by admin.");
                    addNotification(state, "admin", recyclerName + " approved.");
                    addNotification(state, "user", recyclerName + " has been approved for your pickup route.");
                    syncRequestStatus(state, true);
                    saveState(state);
                    paintAdmin();
                });
            }
        });

        if (markAdminReadBtn) {
            markAdminReadBtn.addEventListener("click", function () {
                markAllRead(state, "admin");
                saveState(state);
                paintAdmin();
            });
        }

        if (markAdminUnreadBtn) {
            markAdminUnreadBtn.addEventListener("click", function () {
                markAllUnread(state, "admin");
                saveState(state);
                paintAdmin();
            });
        }
        window.addEventListener("storage", function () {
            const refreshed = loadState();
            Object.assign(state, refreshed);
            paintAdmin();
        });

        paintAdmin();
    }

    const state = loadState();
    saveState(state);
    setupDashboard(state);
    setupAdmin(state);
})();
