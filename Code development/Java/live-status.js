(function () {
    "use strict";

    const STORAGE_KEYS = {
        request: "ewaste_latest_request",
        activity: "ewaste_activity_log",
        userNotifications: "ewaste_user_notifications",
        adminNotifications: "ewaste_admin_notifications",
        recyclerRatings: "ewaste_recycler_ratings"
    };

    const STATUS_FLOW = ["SUBMITTED", "SCHEDULED", "IN_TRANSIT", "COMPLETED"];

    function readJson(key, fallbackValue) {
        const rawValue = localStorage.getItem(key);
        if (!rawValue) {
            return fallbackValue;
        }

        try {
            return JSON.parse(rawValue);
        } catch (error) {
            return fallbackValue;
        }
    }

    function writeJson(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function getCurrentUserEmail() {
        const currentUser = readJson("ewaste_current_user", null);
        return currentUser && currentUser.email ? currentUser.email : "guest@local";
    }

    function getAccounts() {
        return readJson("ewaste_accounts", []);
    }

    function saveAccounts(accounts) {
        writeJson("ewaste_accounts", accounts);
    }

    function renderUserPointsCard() {
        const balanceElement = document.getElementById("points-balance");
        const earnedElement = document.getElementById("points-earned");
        const redeemedElement = document.getElementById("points-redeemed");

        if (!balanceElement || !earnedElement || !redeemedElement) {
            return;
        }

        const currentUser = readJson("ewaste_current_user", null);
        if (!currentUser || !currentUser.email) {
            balanceElement.textContent = "0 pts";
            earnedElement.textContent = "0";
            redeemedElement.textContent = "0";
            return;
        }

        const accounts = getAccounts();
        const account = accounts.find(function (item) {
            return item.email === currentUser.email;
        });

        const pointsBalance = account && Number.isFinite(Number(account.pointsBalance)) ? Number(account.pointsBalance) : 0;
        const totalPointsEarned = account && Number.isFinite(Number(account.totalPointsEarned)) ? Number(account.totalPointsEarned) : 0;
        const totalPointsRedeemed = account && Number.isFinite(Number(account.totalPointsRedeemed)) ? Number(account.totalPointsRedeemed) : 0;

        balanceElement.textContent = pointsBalance + " pts";
        earnedElement.textContent = String(totalPointsEarned);
        redeemedElement.textContent = String(totalPointsRedeemed);
    }

    function formatStatus(status) {
        return String(status || "").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, function (char) {
            return char.toUpperCase();
        });
    }

    function formatTime(timestamp) {
        return new Date(timestamp).toLocaleString();
    }

    function makeRequestId() {
        const stamp = Date.now().toString().slice(-6);
        const suffix = Math.floor(Math.random() * 900 + 100);
        return "REQ-" + stamp + "-" + suffix;
    }

    function deriveAutoStatus(request) {
        if (!request || request.status === "CANCELLED" || request.status === "COMPLETED") {
            return request ? request.status : "";
        }

        const createdAt = Number(request.createdAt || Date.now());
        const elapsedSeconds = Math.floor((Date.now() - createdAt) / 1000);

        if (elapsedSeconds >= 30) {
            return "IN_TRANSIT";
        }

        if (elapsedSeconds >= 15) {
            return "SCHEDULED";
        }

        return "SUBMITTED";
    }

    function addActivity(message) {
        const activityLog = readJson(STORAGE_KEYS.activity, []);
        activityLog.unshift({
            message: message,
            timestamp: Date.now()
        });

        writeJson(STORAGE_KEYS.activity, activityLog.slice(0, 20));
    }

    function pushNotification(storageKey, message) {
        const notifications = readJson(storageKey, []);
        notifications.unshift({
            message: message,
            timestamp: Date.now(),
            read: false
        });

        writeJson(storageKey, notifications.slice(0, 30));
    }

    function renderNotifications(listId, countId, storageKey) {
        const listElement = document.getElementById(listId);
        const countElement = document.getElementById(countId);
        const markReadButton = document.getElementById(listId.indexOf("admin") === 0 ? "mark-admin-read-btn" : "mark-user-read-btn");
        const markUnreadButton = document.getElementById(listId.indexOf("admin") === 0 ? "mark-admin-unread-btn" : "mark-user-unread-btn");

        if (!listElement || !countElement) {
            return;
        }

        const notifications = readJson(storageKey, []);
        const unreadCount = notifications.filter(function (item) {
            return !item.read;
        }).length;

        countElement.textContent = unreadCount + " unread";
        listElement.innerHTML = "";

        if (!notifications.length) {
            const empty = document.createElement("li");
            empty.className = "muted";
            empty.textContent = "No notifications yet.";
            listElement.appendChild(empty);
        } else {
            notifications.slice(0, 8).forEach(function (item) {
                const li = document.createElement("li");
                li.className = item.read ? "notification-item" : "notification-item unread";
                li.textContent = item.message + " (" + formatTime(item.timestamp) + ")";
                listElement.appendChild(li);
            });
        }

        if (markReadButton && !markReadButton.dataset.bound) {
            markReadButton.dataset.bound = "true";
            markReadButton.addEventListener("click", function () {
                const updated = readJson(storageKey, []).map(function (item) {
                    return Object.assign({}, item, { read: true });
                });

                writeJson(storageKey, updated);
                renderNotifications(listId, countId, storageKey);
            });
        }

        if (markUnreadButton && !markUnreadButton.dataset.bound) {
            markUnreadButton.dataset.bound = "true";
            markUnreadButton.addEventListener("click", function () {
                const updated = readJson(storageKey, []).map(function (item) {
                    return Object.assign({}, item, { read: false });
                });

                writeJson(storageKey, updated);
                renderNotifications(listId, countId, storageKey);
            });
        }
    }

    function renderDashboardRequest() {
        const requestIdElement = document.getElementById("request-id");
        const requestStatusElement = document.getElementById("request-status");

        if (!requestIdElement || !requestStatusElement) {
            return;
        }

        const request = readJson(STORAGE_KEYS.request, null);

        if (!request) {
            requestIdElement.textContent = "No request yet";
            requestStatusElement.textContent = "No active request";
            return;
        }

        const autoStatus = deriveAutoStatus(request);
        if (autoStatus && autoStatus !== request.status) {
            request.status = autoStatus;
            request.updatedAt = Date.now();
            writeJson(STORAGE_KEYS.request, request);

            addActivity("Request " + request.id + " moved to " + formatStatus(request.status) + ".");
            pushNotification(STORAGE_KEYS.userNotifications, "Your pickup request is now " + formatStatus(request.status) + ".");
            pushNotification(STORAGE_KEYS.adminNotifications, "Request " + request.id + " changed to " + formatStatus(request.status) + ".");
        }

        requestIdElement.textContent = request.id;
        requestStatusElement.textContent = formatStatus(request.status);
    }

    function renderAdminLiveFeed() {
        const statusElement = document.getElementById("admin-live-status");
        const logElement = document.getElementById("admin-activity-log");

        if (!statusElement || !logElement) {
            return;
        }

        const request = readJson(STORAGE_KEYS.request, null);
        if (!request) {
            statusElement.textContent = "Waiting for activity...";
        } else {
            statusElement.textContent = "Latest request " + request.id + " is " + formatStatus(request.status) + ".";
        }

        const activityLog = readJson(STORAGE_KEYS.activity, []);
        logElement.innerHTML = "";

        if (!activityLog.length) {
            const li = document.createElement("li");
            li.className = "muted";
            li.textContent = "No recent activity yet.";
            logElement.appendChild(li);
            return;
        }

        activityLog.slice(0, 6).forEach(function (entry) {
            const li = document.createElement("li");
            li.textContent = entry.message + " (" + formatTime(entry.timestamp) + ")";
            logElement.appendChild(li);
        });
    }

    function wireDashboardForm() {
        const form = document.getElementById("waste-request-form");
        if (!form) {
            return;
        }

        form.addEventListener("submit", function (event) {
            event.preventDefault();

            const request = {
                id: makeRequestId(),
                status: "SUBMITTED",
                createdAt: Date.now(),
                updatedAt: Date.now(),
                rewardGranted: false,
                rewardedPoints: 0,
                userEmail: getCurrentUserEmail(),
                deviceType: document.getElementById("device-type") ? document.getElementById("device-type").value : "",
                quantity: document.getElementById("quantity") ? document.getElementById("quantity").value : "",
                pickupLocation: document.getElementById("pickup-location") ? document.getElementById("pickup-location").value : "",
                weightKg: document.getElementById("weight-kg") ? Number(document.getElementById("weight-kg").value || 0) : 0
            };

            writeJson(STORAGE_KEYS.request, request);
            addActivity("New request " + request.id + " was submitted.");
            pushNotification(STORAGE_KEYS.userNotifications, "Request " + request.id + " submitted successfully.");
            pushNotification(STORAGE_KEYS.adminNotifications, "New pickup request " + request.id + " needs review.");

            renderDashboardRequest();
            renderAdminLiveFeed();
            renderNotifications("user-notification-list", "user-unread-count", STORAGE_KEYS.userNotifications);
            renderNotifications("admin-notification-list", "admin-unread-count", STORAGE_KEYS.adminNotifications);
            form.reset();
        });
    }

    function wireRemoveRequestButton() {
        const removeButton = document.getElementById("remove-request-btn");
        if (!removeButton) {
            return;
        }

        removeButton.addEventListener("click", function () {
            const request = readJson(STORAGE_KEYS.request, null);
            if (!request) {
                return;
            }

            addActivity("Request " + request.id + " was removed by the user.");
            pushNotification(STORAGE_KEYS.userNotifications, "Request " + request.id + " has been removed.");
            pushNotification(STORAGE_KEYS.adminNotifications, "Request " + request.id + " was cancelled/removed.");

            localStorage.removeItem(STORAGE_KEYS.request);

            renderDashboardRequest();
            renderAdminLiveFeed();
            renderNotifications("user-notification-list", "user-unread-count", STORAGE_KEYS.userNotifications);
            renderNotifications("admin-notification-list", "admin-unread-count", STORAGE_KEYS.adminNotifications);
        });
    }

    function renderRecyclerRating() {
        const section = document.getElementById("recycler-rating-section");
        const form = document.getElementById("recycler-rating-form");
        const valueInput = document.getElementById("recycler-rating-value");
        const note = document.getElementById("recycler-rating-note");
        const request = readJson(STORAGE_KEYS.request, null);

        if (!section || !form || !valueInput || !note) {
            return;
        }

        if (!request || request.status !== "COMPLETED") {
            section.style.display = "none";
            return;
        }

        section.style.display = "block";

        const ratings = readJson(STORAGE_KEYS.recyclerRatings, []);
        const userEmail = getCurrentUserEmail();
        const existingRating = ratings.find(function (item) {
            return item.requestId === request.id && item.userEmail === userEmail;
        });

        if (existingRating) {
            valueInput.value = String(existingRating.score);
            valueInput.disabled = true;
            note.textContent = "You already rated this completed request.";
            return;
        }

        valueInput.disabled = false;
        note.textContent = "Rate your recycler for request " + request.id + ".";
    }

    function wireRecyclerRatingForm() {
        const form = document.getElementById("recycler-rating-form");
        if (!form || form.dataset.bound) {
            return;
        }

        form.dataset.bound = "true";
        form.addEventListener("submit", function (event) {
            event.preventDefault();

            const request = readJson(STORAGE_KEYS.request, null);
            const scoreInput = document.getElementById("recycler-rating-value");
            const commentInput = document.getElementById("recycler-rating-comment");
            const note = document.getElementById("recycler-rating-note");
            if (!request || request.status !== "COMPLETED" || !scoreInput || !note) {
                return;
            }

            const score = Number(scoreInput.value);
            if (!Number.isFinite(score) || score < 1 || score > 5) {
                note.textContent = "Please select a rating between 1 and 5.";
                return;
            }

            const ratings = readJson(STORAGE_KEYS.recyclerRatings, []);
            const userEmail = getCurrentUserEmail();
            const alreadyRated = ratings.some(function (item) {
                return item.requestId === request.id && item.userEmail === userEmail;
            });

            if (alreadyRated) {
                note.textContent = "You already rated this completed request.";
                return;
            }

            ratings.unshift({
                requestId: request.id,
                userEmail: userEmail,
                score: score,
                comment: commentInput ? commentInput.value.trim() : "",
                recyclerId: "default_recycler",
                createdAt: Date.now()
            });

            writeJson(STORAGE_KEYS.recyclerRatings, ratings.slice(0, 100));
            scoreInput.disabled = true;
            note.textContent = "Thanks. Your rating was submitted.";
            addActivity("User rated recycler " + score + "/5 for request " + request.id + ".");
            pushNotification(STORAGE_KEYS.adminNotifications, "New recycler rating: " + score + "/5 for request " + request.id + ".");
        });
    }

    function init() {
        wireDashboardForm();
        wireRemoveRequestButton();
        wireRecyclerRatingForm();

        renderDashboardRequest();
        renderRecyclerRating();
        renderUserPointsCard();
        renderAdminLiveFeed();
        renderNotifications("user-notification-list", "user-unread-count", STORAGE_KEYS.userNotifications);
        renderNotifications("admin-notification-list", "admin-unread-count", STORAGE_KEYS.adminNotifications);

        setInterval(function () {
            renderDashboardRequest();
            renderRecyclerRating();
            renderUserPointsCard();
            renderAdminLiveFeed();
        }, 5000);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
