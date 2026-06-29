 (function () {
            const STORAGE_KEYS = {
                recyclerApprovals: "ewaste_recycler_approvals",
                adminNotifications: "ewaste_admin_notifications"
            };

            const adminName = document.getElementById("admin-name");
            const approvalsList = document.getElementById("pending-approvals-list");
            const pendingApprovalsCount = document.getElementById("pending-approvals-count");

            if (!adminName) {
                return;
            }

            const rawCurrentUser = localStorage.getItem("ewaste_current_user");
            if (rawCurrentUser) {
                try {
                    const currentUser = JSON.parse(rawCurrentUser);
                    if (currentUser && currentUser.fullName) {
                        adminName.textContent = currentUser.fullName;
                    }
                } catch (error) {
                    // Keep the default name when stored session data is invalid.
                }
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

            function addAdminNotification(message) {
                const notifications = readJson(STORAGE_KEYS.adminNotifications, []);
                notifications.unshift({
                    message: message,
                    timestamp: Date.now(),
                    read: false
                });
                writeJson(STORAGE_KEYS.adminNotifications, notifications.slice(0, 30));
            }

            function renderApprovals() {
                if (!approvalsList || !pendingApprovalsCount) {
                    return;
                }

                const approvals = readJson(STORAGE_KEYS.recyclerApprovals, []);
                const pendingApprovals = approvals.filter(function (item) {
                    return item.status !== "APPROVED";
                });

                pendingApprovalsCount.textContent = pendingApprovals.length + " pending";
                approvalsList.innerHTML = "";

                if (!pendingApprovals.length) {
                    const empty = document.createElement("p");
                    empty.className = "muted";
                    empty.textContent = "No recycler approval requests pending.";
                    approvalsList.appendChild(empty);
                    return;
                }

                pendingApprovals.forEach(function (item) {
                    const wrapper = document.createElement("div");
                    wrapper.className = "approval-item";

                    const submittedOn = new Date(Number(item.createdAt || Date.now())).toLocaleDateString();
                    wrapper.innerHTML = ""
                        + "<p><strong>" + (item.companyName || "Unknown Recycler") + "</strong></p>"
                        + "<p>" + (item.nemaLicense || "No NEMA ID") + " | " + submittedOn + "</p>"
                        + "<p>Location: " + (item.location || "-") + " | Type: " + (item.recyclerType || "-") + "</p>"
                        + "<p>Status: <span class=\"badge recycler-status\">Pending</span></p>";

                    const approveButton = document.createElement("button");
                    approveButton.type = "button";
                    approveButton.className = "btn approve-btn";
                    approveButton.textContent = "Approve";
                    approveButton.addEventListener("click", function () {
                        const updatedApprovals = readJson(STORAGE_KEYS.recyclerApprovals, []).map(function (approval) {
                            if (approval.id === item.id) {
                                return Object.assign({}, approval, {
                                    status: "APPROVED",
                                    updatedAt: Date.now()
                                });
                            }
                            return approval;
                        });

                        writeJson(STORAGE_KEYS.recyclerApprovals, updatedApprovals);
                        addAdminNotification("Recycler " + (item.companyName || "Unknown Recycler") + " approved successfully.");
                        renderApprovals();
                    });

                    wrapper.appendChild(approveButton);
                    approvalsList.appendChild(wrapper);
                });
            }

            renderApprovals();
        })();
   
    