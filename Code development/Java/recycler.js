(function () {
            const STORAGE_KEYS = {
                request: "ewaste_latest_request",
                accounts: "ewaste_accounts",
                currentUser: "ewaste_current_user",
                recyclerAwardedPoints: "ewaste_recycler_awarded_points",
                recyclerPickupCount: "ewaste_recycler_pickup_count",
                recyclerApprovals: "ewaste_recycler_approvals",
                adminNotifications: "ewaste_admin_notifications"
            };

            const recyclerName = document.getElementById("recycler-name");
            const recyclerTypeDisplay = document.getElementById("recycler-type-display");
            const recyclerRating = document.getElementById("recycler-rating");
            const recyclerStatus = document.getElementById("recycler-status");
            const registrationForm = document.getElementById("registration-form");
            const approveButton = document.getElementById("approve-btn");
            const registrationNote = document.getElementById("registration-note");
            const profileForm = document.getElementById("profile-form");
            const profileNote = document.getElementById("profile-note");
            const summaryPickups = document.getElementById("summary-pickups");
            const summaryPoints = document.getElementById("summary-points");
            let pickupCount = Number(localStorage.getItem(STORAGE_KEYS.recyclerPickupCount) || 0);
            let totalAwardedPoints = Number(localStorage.getItem(STORAGE_KEYS.recyclerAwardedPoints) || 0);
            let certified = false;

            if (!registrationForm || !approveButton || !recyclerName || !recyclerStatus || !recyclerTypeDisplay || !summaryPickups || !summaryPoints) {
                return;
            }

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

            function getCurrentUser() {
                return readJson(STORAGE_KEYS.currentUser, null);
            }

            function getCurrentUserEmail() {
                const currentUser = getCurrentUser();
                return currentUser && currentUser.email ? String(currentUser.email).toLowerCase() : "guest@local";
            }

            function addAdminNotification(message) {
                const notifications = readJson(STORAGE_KEYS.adminNotifications, []);
                notifications.unshift({
                    message: message,
                    timestamp: Date.now(),
                    read: false
                });
                writeJson(STORAGE_KEYS.adminNotifications, notifications.slice(0, 30));
            }

            function upsertApproval(statusValue) {
                const approvals = readJson(STORAGE_KEYS.recyclerApprovals, []);
                const now = Date.now();
                const name = document.getElementById("facility-name").value.trim();
                const location = document.getElementById("facility-location").value.trim();
                const license = document.getElementById("nema-license").value.trim();
                const type = document.getElementById("recycler-type").value;
                const phone = document.getElementById("facility-phone").value.trim();
                const userEmail = getCurrentUserEmail();
                const existingIndex = approvals.findIndex(function (item) {
                    return String(item.userEmail || "").toLowerCase() === userEmail;
                });

                const nextApproval = {
                    id: existingIndex !== -1 ? approvals[existingIndex].id : "APR-" + now.toString().slice(-6),
                    userEmail: userEmail,
                    companyName: name || recyclerName.textContent || "Unknown Recycler",
                    location: location,
                    nemaLicense: license,
                    recyclerType: type,
                    phone: phone,
                    status: statusValue,
                    createdAt: existingIndex !== -1 ? Number(approvals[existingIndex].createdAt || now) : now,
                    updatedAt: now
                };

                if (existingIndex === -1) {
                    approvals.unshift(nextApproval);
                } else {
                    approvals[existingIndex] = nextApproval;
                }

                writeJson(STORAGE_KEYS.recyclerApprovals, approvals);
                return nextApproval;
            }

            function applyApprovalState() {
                const approvals = readJson(STORAGE_KEYS.recyclerApprovals, []);
                const userEmail = getCurrentUserEmail();
                const approval = approvals.find(function (item) {
                    return String(item.userEmail || "").toLowerCase() === userEmail;
                });

                if (!approval) {
                    return;
                }

                if (approval.companyName) {
                    recyclerName.textContent = approval.companyName;
                }
                if (approval.recyclerType) {
                    recyclerTypeDisplay.textContent = approval.recyclerType;
                }

                certified = approval.status === "APPROVED";
                if (certified) {
                    recyclerStatus.className = "status-chip status-active";
                    recyclerStatus.textContent = "Approved And Active";
                    registrationNote.textContent = "Facility approved. You are now visible to users.";
                } else {
                    recyclerStatus.className = "status-chip status-pending";
                    recyclerStatus.textContent = "Pending Approval";
                    registrationNote.textContent = "Registration submitted. Waiting for admin verification.";
                }
            }

            function getStatusClass(status) {
                if (status === "SCHEDULED") {
                    return "status-chip status-accepted request-status";
                }
                if (status === "IN_TRANSIT" || status === "SUBMITTED") {
                    return "status-chip status-submitted request-status";
                }
                if (status === "COMPLETED") {
                    return "status-chip status-completed request-status";
                }
                if (status === "CANCELLED") {
                    return "status-chip status-rejected request-status";
                }
                return "status-chip status-submitted request-status";
            }

            function getStatusNote(status) {
                if (status === "SCHEDULED") {
                    return "Pickup scheduled.";
                }
                if (status === "IN_TRANSIT") {
                    return "Pickup in transit.";
                }
                if (status === "COMPLETED") {
                    return "Pickup confirmed. Customer reward sent.";
                }
                if (status === "CANCELLED") {
                    return "Request was cancelled.";
                }
                return "Awaiting recycler action.";
            }

            function renderSummary() {
                summaryPickups.textContent = String(pickupCount);
                summaryPoints.textContent = totalAwardedPoints + " pts";
            }

            function renderLatestRequest() {
                const requestItem = document.querySelector(".request-item");
                if (!requestItem) {
                    return;
                }

                const request = readJson(STORAGE_KEYS.request, null);
                const requestTitle = requestItem.querySelector("h3");
                const status = requestItem.querySelector(".request-status");
                const note = requestItem.querySelector(".request-note");

                if (!request || !requestTitle || !status || !note) {
                    return;
                }

                requestItem.setAttribute("data-request-id", request.id);
                requestTitle.textContent = request.id;
                status.className = getStatusClass(request.status);
                status.textContent = request.status;
                note.textContent = getStatusNote(request.status);
            }

            function applyRewardForConfirmedPickup(request) {
                if (!request || request.rewardGranted) {
                    return 0;
                }

                const points = Math.max(0, Math.round(Number(request.weightKg || 0) * 10));
                const accounts = readJson(STORAGE_KEYS.accounts, []);
                const requestOwnerEmail = String(request.userEmail || "").toLowerCase();
                const ownerIndex = accounts.findIndex(function (account) {
                    return String(account.email || "").toLowerCase() === requestOwnerEmail;
                });

                if (ownerIndex !== -1) {
                    const owner = accounts[ownerIndex];
                    const currentBalance = Number(owner.pointsBalance || 0);
                    const currentEarned = Number(owner.totalPointsEarned || 0);

                    owner.pointsBalance = currentBalance + points;
                    owner.totalPointsEarned = currentEarned + points;
                    owner.totalPointsRedeemed = Number(owner.totalPointsRedeemed || 0);
                    accounts[ownerIndex] = owner;
                    writeJson(STORAGE_KEYS.accounts, accounts);

                    const currentUser = readJson(STORAGE_KEYS.currentUser, null);
                    if (currentUser && String(currentUser.email || "").toLowerCase() === requestOwnerEmail) {
                        currentUser.pointsBalance = owner.pointsBalance;
                        currentUser.totalPointsEarned = owner.totalPointsEarned;
                        currentUser.totalPointsRedeemed = owner.totalPointsRedeemed;
                        writeJson(STORAGE_KEYS.currentUser, currentUser);
                    }
                }

                request.rewardGranted = true;
                request.rewardedPoints = points;
                request.updatedAt = Date.now();
                writeJson(STORAGE_KEYS.request, request);

                totalAwardedPoints += points;
                localStorage.setItem(STORAGE_KEYS.recyclerAwardedPoints, String(totalAwardedPoints));

                return points;
            }

            renderSummary();
            renderLatestRequest();
            applyApprovalState();

            const ratings = JSON.parse(localStorage.getItem("ewaste_recycler_ratings") || "[]");
            const scores = ratings
                .map(function (item) { return Number(item.score); })
                .filter(function (value) { return Number.isFinite(value) && value >= 1 && value <= 5; });
            if (scores.length && recyclerRating) {
                const total = scores.reduce(function (sum, value) { return sum + value; }, 0);
                recyclerRating.textContent = (total / scores.length).toFixed(1);
            }

            registrationForm.addEventListener("submit", function (event) {
                event.preventDefault();
                const name = document.getElementById("facility-name").value.trim();
                const type = document.getElementById("recycler-type").value;
                const ratingInput = document.getElementById("recycler-rating-input");
                const ratingValue = ratingInput ? Number(ratingInput.value) : NaN;
                recyclerName.textContent = name || "Not registered";
                recyclerTypeDisplay.textContent = type;
                if (recyclerRating) {
                    recyclerRating.textContent = Number.isFinite(ratingValue) ? ratingValue.toFixed(1) : recyclerRating.textContent || "0.0";
                }
                recyclerStatus.className = "status-chip status-pending";
                recyclerStatus.textContent = "Pending Approval";
                certified = false;
                registrationNote.textContent = "Registration submitted. Waiting for admin verification.";

                const approval = upsertApproval("PENDING");
                addAdminNotification("Recycler approval request " + approval.id + " submitted by " + approval.companyName + ".");
            });

            approveButton.addEventListener("click", function () {
                recyclerStatus.className = "status-chip status-active";
                recyclerStatus.textContent = "Approved And Active";
                certified = true;
                registrationNote.textContent = "Facility approved. You are now visible to users.";

                const approval = upsertApproval("APPROVED");
                addAdminNotification("Recycler " + approval.companyName + " marked approved.");
            });

            document.querySelectorAll(".request-action").forEach(function (button) {
                button.addEventListener("click", function () {
                    const requestItem = button.closest(".request-item");
                    const status = requestItem ? requestItem.querySelector(".request-status") : null;
                    const note = requestItem ? requestItem.querySelector(".request-note") : null;
                    const action = button.getAttribute("data-action");
                    const request = readJson(STORAGE_KEYS.request, null);

                    if (!status || !note || !action) {
                        return;
                    }

                    if (!request) {
                        note.textContent = "No active pickup request to process.";
                        return;
                    }

                    if (!certified) {
                        note.textContent = "Approve this recycler first before updating request status.";
                        return;
                    }

                    if (action === "accept") {
                        request.status = "SCHEDULED";
                        request.updatedAt = Date.now();
                        writeJson(STORAGE_KEYS.request, request);
                        status.className = getStatusClass(request.status);
                        status.textContent = request.status;
                        note.textContent = getStatusNote(request.status);
                        return;
                    }

                    if (action === "reject") {
                        const reason = window.prompt("Enter rejection reason:", "");
                        if (!reason || !reason.trim()) {
                            return;
                        }
                        request.status = "CANCELLED";
                        request.updatedAt = Date.now();
                        writeJson(STORAGE_KEYS.request, request);
                        status.className = getStatusClass(request.status);
                        status.textContent = request.status;
                        note.textContent = "Cancelled. Reason: " + reason.trim();
                        return;
                    }

                    if (request.status === "SCHEDULED") {
                        request.status = "IN_TRANSIT";
                        request.updatedAt = Date.now();
                        writeJson(STORAGE_KEYS.request, request);
                        status.className = getStatusClass(request.status);
                        status.textContent = request.status;
                        note.textContent = getStatusNote(request.status);
                        return;
                    }

                    if (request.status === "IN_TRANSIT") {
                        request.status = "COMPLETED";
                        request.updatedAt = Date.now();
                        writeJson(STORAGE_KEYS.request, request);

                        const awardedPoints = applyRewardForConfirmedPickup(request);

                        status.className = getStatusClass(request.status);
                        status.textContent = request.status;
                        note.textContent = "Pickup confirmed. Points awarded: " + awardedPoints;

                        pickupCount += 1;
                        localStorage.setItem(STORAGE_KEYS.recyclerPickupCount, String(pickupCount));
                        renderSummary();
                        return;
                    }

                    note.textContent = "Request is already " + request.status + ".";
                });
            });

            if (profileForm && profileNote) {
                profileForm.addEventListener("submit", function (event) {
                    event.preventDefault();
                    profileNote.textContent = "Profile updated and synced.";
                });
            }

            setInterval(applyApprovalState, 3000);
    })();
    