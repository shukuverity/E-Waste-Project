import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class Main {

	private static final List<User> users = new ArrayList<>();
	private static final List<Recycler> recyclers = new ArrayList<>();
	private static final List<WasteRequest> requests = new ArrayList<>();
	private static final List<String> contactMessages = new ArrayList<>();
	private static final Admin platformAdmin = new Admin("ADM-001", "STANDARD");
	private static int requestSequence = 1000;

	public static void main(String[] args) {
		seedRecyclerDirectory();

		User account = registerFromSignupForm(
				"Jane Mwangi",
				"jane@email.com",
				"+254700111222",
				"User",
				"Pass123",
				"Pass123"
		);

		if (account == null) {
			System.out.println("Sign up failed.");
			return;
		}

		User loggedIn = loginFromLoginForm("jane@email.com", "Pass123");
		if (loggedIn == null) {
			System.out.println("Login failed.");
			return;
		}

		WasteRequest request = submitWasteRequestFromDashboard(
				loggedIn.getEmail(),
				"Laptop",
				2,
				"Working",
				"2026-06-25",
				"Nairobi CBD",
				"11:00 - 13:00",
				8.5,
				"Two old office laptops"
		);

		System.out.println("Created request: " + request.getRequestId() + " | Status: " + request.getStatus());
		advanceTrackingStatus(request.getRequestId());
		advanceTrackingStatus(request.getRequestId());
		confirmPickupByRecycler(request.getRequestId(), "WEEE Centre");
		System.out.println("Updated request status: " + request.getStatus());
		System.out.println("User points balance: " + loggedIn.getPointsBalance());

		List<Recycler> found = searchRecyclerFromDashboard("Nairobi", "All recyclers");
		System.out.println("Recyclers found: " + found.size());

		submitContactFromContactPage(
				"Jane Mwangi",
				"jane@email.com",
				"+254700111222",
				"Pickup Request",
				"Please confirm my pickup time"
		);
		System.out.println("Contact messages: " + contactMessages.size());
	}

	public static User registerFromSignupForm(String fullName, String email, String phoneNumber,
											  String role, String password, String confirmPassword) {
		if (fullName == null || fullName.isBlank() || email == null || email.isBlank()) {
			return null;
		}
		if (password == null || !password.equals(confirmPassword)) {
			return null;
		}
		if (findUserByEmail(email) != null) {
			return null;
		}

		User user;
		if ("Recycler".equalsIgnoreCase(role)) {
			Recycler recycler = new Recycler(fullName, "Nairobi", "All recyclers", "PENDING", 0.0, false);
			recycler.setEmail(email);
			recycler.setPhoneNumber(phoneNumber);
			recycler.setPassword(password);
			user = recycler;
		} else if ("Admin Personnel".equalsIgnoreCase(role)) {
			user = new Admin("ADM-PENDING", "STANDARD");
			user.setFullName(fullName);
			user.setEmail(email);
			user.setPhoneNumber(phoneNumber);
			user.setPassword(password);
		} else {
			user = new User(fullName, email, phoneNumber, role, password);
		}

		user.setRole(role);
		users.add(user);
		return user;
	}

	public static User loginFromLoginForm(String email, String password) {
		User user = findUserByEmail(email);
		if (user == null) {
			return null;
		}
		return user.login(password) ? user : null;
	}

	public static WasteRequest submitWasteRequestFromDashboard(String userEmail, String deviceType, int quantity,
															   String condition, String pickupDate,
															   String pickupLocation, String preferredTime,
															   double weightKg, String details) {
		WasteRequest request = new WasteRequest(
				nextRequestId(),
				userEmail,
				deviceType,
				quantity,
				condition,
				pickupDate,
				pickupLocation,
				preferredTime,
				weightKg,
				details
		);

		requests.add(request);

		return request;
	}

	public static WasteRequest advanceTrackingStatus(String requestId) {
		WasteRequest request = findRequestById(requestId);
		if (request == null) {
			return null;
		}
		if (request.getStatus() == WasteRequest.Status.COMPLETED
				|| request.getStatus() == WasteRequest.Status.CANCELLED) {
			return request;
		}
		request.advanceStatus();
		return request;
	}

	public static String confirmPickupByRecycler(String requestId, String recyclerName) {
		WasteRequest request = findRequestById(requestId);
		if (request == null) {
			return "Request not found: " + requestId;
		}

		Recycler recycler = findRecyclerByName(recyclerName);
		if (recycler == null) {
			return "Recycler not found: " + recyclerName;
		}

		if (request.getStatus() == WasteRequest.Status.CANCELLED) {
			return "Request " + requestId + " is cancelled and cannot be confirmed.";
		}

		while (request.getStatus() != WasteRequest.Status.COMPLETED) {
			request.advanceStatus();
		}

		recycler.incrementPickupCount();

		int awardedPoints = 0;
		User requestOwner = findUserByEmail(request.getUserEmail());
		if (requestOwner != null && request.markRewardGranted()) {
			awardedPoints = request.calculateAwardedPoints();
			requestOwner.addPoints(awardedPoints);
		}

		return "Pickup confirmed for " + requestId
				+ " by " + recycler.getCompanyName()
				+ ". Points awarded: " + awardedPoints;
	}

	public static boolean removeRequest(String requestId) {
		WasteRequest request = findRequestById(requestId);
		if (request == null) {
			return false;
		}
		request.cancel();
		return requests.remove(request);
	}

	public static List<Recycler> searchRecyclerFromDashboard(String location, String recyclerType) {
		List<Recycler> matches = new ArrayList<>();
		for (Recycler recycler : recyclers) {
			if (recycler.matchesSearch(location, recyclerType)) {
				matches.add(recycler);
			}
		}
		return matches;
	}

	public static void submitContactFromContactPage(String name, String email, String phone,
													String subject, String message) {
		String line = "Name=" + name
				+ " | Email=" + email
				+ " | Phone=" + phone
				+ " | Subject=" + subject
				+ " | Message=" + message;
		contactMessages.add(line);
	}

	public static String validateRecyclerFromAdminPage(String recyclerName) {
		Recycler recycler = findRecyclerByName(recyclerName);
		if (recycler == null) {
			return "Recycler not found: " + recyclerName;
		}
		return platformAdmin.validateRecycler(recycler);
	}

	public static String approveRecyclerFromAdminPage(String recyclerName) {
		Recycler recycler = findRecyclerByName(recyclerName);
		if (recycler == null) {
			return "Recycler not found: " + recyclerName;
		}
		return platformAdmin.approveRecycler(recycler);
	}

	public static void clearContactMessages() {
		contactMessages.clear();
	}

	public static List<String> getRequestStatusFlowFromSource() {
		return Arrays.asList(
				WasteRequest.Status.SUBMITTED.name(),
				WasteRequest.Status.SCHEDULED.name(),
				WasteRequest.Status.IN_TRANSIT.name(),
				WasteRequest.Status.COMPLETED.name(),
				WasteRequest.Status.CANCELLED.name()
		);
	}

	public static String getLiveStatusSnapshot() {
		String latestRequestStatus = requests.isEmpty()
				? "NO_ACTIVE_REQUEST"
				: requests.get(requests.size() - 1).getStatus().name();

		int certifiedRecyclers = 0;
		for (Recycler recycler : recyclers) {
			if (recycler.isCertified()) {
				certifiedRecyclers++;
			}
		}

		return "RequestStatus=" + latestRequestStatus
				+ " | TotalRequests=" + requests.size()
				+ " | CertifiedRecyclers=" + certifiedRecyclers
				+ " | PendingContactMessages=" + contactMessages.size();
	}

	private static void seedRecyclerDirectory() {
		recyclers.add(new Recycler("WEEE Centre", "Nairobi", "Household e-waste", "NEMA-001", 4.5, true));
		recyclers.add(new Recycler("CFSK", "Nakuru", "Business e-waste", "NEMA-002", 4.2, true));
		recyclers.add(new Recycler("EACR", "Kisumu", "Batteries and power units", "NEMA-003", 4.0, true));
	}

	private static User findUserByEmail(String email) {
		for (User user : users) {
			if (user.getEmail().equalsIgnoreCase(email)) {
				return user;
			}
		}
		return null;
	}

	private static WasteRequest findRequestById(String requestId) {
		for (WasteRequest request : requests) {
			if (request.getRequestId().equalsIgnoreCase(requestId)) {
				return request;
			}
		}
		return null;
	}

	private static Recycler findRecyclerByName(String recyclerName) {
		for (Recycler recycler : recyclers) {
			if (recycler.getCompanyName().equalsIgnoreCase(recyclerName)) {
				return recycler;
			}
		}
		return null;
	}

	private static String nextRequestId() {
		requestSequence++;
		return "REQ-" + requestSequence;
	}
}
