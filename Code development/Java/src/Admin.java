/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */

/**
 *
 * @author verit
 */
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class Admin extends User {

	// Encapsulation: admin data kept private
	private String adminId;
	private String adminLevel;
	private final List<String> activityLog;

	public Admin() {
		super("Admin", "admin@ewaste.com", "", "Admin Personnel", "admin123");
		this.adminId = "ADM-001";
		this.adminLevel = "STANDARD";
		this.activityLog = new ArrayList<>();
	}

	public Admin(String adminId, String adminLevel) {
		super("Admin", "admin@ewaste.com", "", "Admin Personnel", "admin123");
		this.adminId = adminId;
		this.adminLevel = adminLevel;
		this.activityLog = new ArrayList<>();
	}

	public String getAdminId() {
		return adminId;
	}

	public void setAdminId(String adminId) {
		this.adminId = adminId;
	}

	public String getAdminLevel() {
		return adminLevel;
	}

	public void setAdminLevel(String adminLevel) {
		this.adminLevel = adminLevel;
	}

	// Admin action: approve recycler account
	public String approveRecycler(Recycler recycler) {
		recycler.setCertified(true);
		String message = "Recycler approved: " + recycler.getCompanyName();
		logActivity(message);
		return message;
	}

	// Admin action: reject recycler account
	public String rejectRecycler(Recycler recycler, String reason) {
		recycler.setCertified(false);
		String message = "Recycler rejected: " + recycler.getCompanyName() + " (Reason: " + reason + ")";
		logActivity(message);
		return message;
	}

	public String validateRecycler(Recycler recycler) {
		String status = recycler.isCertified() ? "Certified" : "Pending";
		String message = "Recycler " + recycler.getCompanyName() + " validation: " + status;
		logActivity(message);
		return message;
	}

	// Admin action: update waste request status from dashboard
	public String updateWasteRequestStatus(WasteRequest request, WasteRequest.Status newStatus) {
		if (newStatus == WasteRequest.Status.CANCELLED) {
			request.cancel();
		} else {
			while (request.getStatus() != newStatus
					&& request.getStatus() != WasteRequest.Status.COMPLETED
					&& request.getStatus() != WasteRequest.Status.CANCELLED) {
				request.advanceStatus();
			}
		}

		String message = "Request " + request.getRequestId() + " updated to status: " + request.getStatus();
		logActivity(message);
		return message;
	}

	// Admin action: respond to contact messages
	public String respondToContactMessage(String senderEmail, String response) {
		String message = "Responded to " + senderEmail + ": " + response;
		logActivity(message);
		return message;
	}

	public List<String> getActivityLog() {
		return Collections.unmodifiableList(activityLog);
	}

	public void clearActivityLog() {
		activityLog.clear();
	}

	private void logActivity(String action) {
		activityLog.add(action);
	}

	// Simple polymorphic-style role method for UI display
	public String getRole() {
		return "Admin Personnel";
	}
}
