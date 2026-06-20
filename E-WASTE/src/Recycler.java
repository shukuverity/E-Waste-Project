public class Recycler extends User {

	private String companyName;
	private String location;
	private String recyclerType;
	private String nemaCertificateId;
	private double rating;
	private boolean certified;
	private int pickupCount;

	public Recycler() {
		super();
		setRole("Recycler");
		this.companyName = "";
		this.location = "";
		this.recyclerType = "All recyclers";
		this.nemaCertificateId = "";
		this.rating = 0.0;
		this.certified = false;
		this.pickupCount = 0;
	}

	public Recycler(String companyName, String location, String recyclerType, String nemaCertificateId,
					double rating, boolean certified) {
		super(companyName, companyName.toLowerCase().replace(" ", "") + "@recycler.com", "", "Recycler", "");
		this.companyName = companyName;
		this.location = location;
		this.recyclerType = recyclerType;
		this.nemaCertificateId = nemaCertificateId;
		this.rating = rating;
		this.certified = certified;
		this.pickupCount = 0;
	}

	public String getCompanyName() {
		return companyName;
	}

	public String getLocation() {
		return location;
	}

	public String getRecyclerType() {
		return recyclerType;
	}

	public String getNemaCertificateId() {
		return nemaCertificateId;
	}

	public double getRating() {
		return rating;
	}

	public boolean isCertified() {
		return certified;
	}

	public void setCertified(boolean certified) {
		this.certified = certified;
	}

	public int getPickupCount() {
		return pickupCount;
	}

	public void incrementPickupCount() {
		this.pickupCount++;
	}

	public boolean matchesSearch(String requestedLocation, String requestedType) {
		boolean matchesLocation = requestedLocation == null
				|| requestedLocation.isBlank()
				|| location.toLowerCase().contains(requestedLocation.toLowerCase());

		boolean matchesType = requestedType == null
				|| requestedType.isBlank()
				|| "All recyclers".equalsIgnoreCase(requestedType)
				|| recyclerType.equalsIgnoreCase(requestedType);

		return matchesLocation && matchesType && certified;
	}

	@Override
	public String toString() {
		return companyName + " | " + location + " | Rating " + rating;
	}
}
