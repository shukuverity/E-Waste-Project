public class WasteRequest {

	public enum Status {
		SUBMITTED,
		SCHEDULED,
		IN_TRANSIT,
		COMPLETED,
		CANCELLED
	}

	private String requestId;
	private String userEmail;
	private String deviceType;
	private int quantity;
	private String condition;
	private String pickupDate;
	private String pickupLocation;
	private String preferredTime;
	private double weightKg;
	private String requestDetails;
	private Status status;

	public WasteRequest(String requestId, String userEmail, String deviceType, int quantity, String condition,
						String pickupDate, String pickupLocation, String preferredTime, double weightKg,
						String requestDetails) {
		this.requestId = requestId;
		this.userEmail = userEmail;
		this.deviceType = deviceType;
		this.quantity = quantity;
		this.condition = condition;
		this.pickupDate = pickupDate;
		this.pickupLocation = pickupLocation;
		this.preferredTime = preferredTime;
		this.weightKg = weightKg;
		this.requestDetails = requestDetails;
		this.status = Status.SUBMITTED;
	}

	public String getRequestId() {
		return requestId;
	}

	public String getUserEmail() {
		return userEmail;
	}

	public String getDeviceType() {
		return deviceType;
	}

	public int getQuantity() {
		return quantity;
	}

	public String getCondition() {
		return condition;
	}

	public String getPickupDate() {
		return pickupDate;
	}

	public String getPickupLocation() {
		return pickupLocation;
	}

	public String getPreferredTime() {
		return preferredTime;
	}

	public double getWeightKg() {
		return weightKg;
	}

	public String getRequestDetails() {
		return requestDetails;
	}

	public Status getStatus() {
		return status;
	}

	public int calculateAwardedPoints() {
		return (int) Math.round(weightKg * 10);
	}

	public void advanceStatus() {
		switch (status) {
			case SUBMITTED:
				status = Status.SCHEDULED;
				break;
			case SCHEDULED:
				status = Status.IN_TRANSIT;
				break;
			case IN_TRANSIT:
				status = Status.COMPLETED;
				break;
			default:
				break;
		}
	}

	public void cancel() {
		this.status = Status.CANCELLED;
	}
}
