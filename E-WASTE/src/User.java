public class User {

	private String fullName;
	private String email;
	private String phoneNumber;
	private String role;
	private String password;
	private int pointsBalance;
	private int totalPointsEarned;
	private int totalPointsRedeemed;
	private boolean loggedIn;

	public User() {
		this("", "", "", "User", "");
	}

	public User(String fullName, String email, String phoneNumber, String role, String password) {
		this.fullName = fullName;
		this.email = email;
		this.phoneNumber = phoneNumber;
		this.role = role;
		this.password = password;
		this.pointsBalance = 0;
		this.totalPointsEarned = 0;
		this.totalPointsRedeemed = 0;
		this.loggedIn = false;
	}

	public String getFullName() {
		return fullName;
	}

	public void setFullName(String fullName) {
		this.fullName = fullName;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getPhoneNumber() {
		return phoneNumber;
	}

	public void setPhoneNumber(String phoneNumber) {
		this.phoneNumber = phoneNumber;
	}

	public String getRole() {
		return role;
	}

	public void setRole(String role) {
		this.role = role;
	}

	public int getPointsBalance() {
		return pointsBalance;
	}

	public int getTotalPointsEarned() {
		return totalPointsEarned;
	}

	public int getTotalPointsRedeemed() {
		return totalPointsRedeemed;
	}

	public boolean isLoggedIn() {
		return loggedIn;
	}

	public boolean checkPassword(String attemptedPassword) {
		return password != null && password.equals(attemptedPassword);
	}

	public void setPassword(String password) {
		this.password = password;
	}

	public boolean login(String attemptedPassword) {
		this.loggedIn = checkPassword(attemptedPassword);
		return this.loggedIn;
	}

	public void logout() {
		this.loggedIn = false;
	}

	public void addPoints(int points) {
		if (points <= 0) {
			return;
		}
		this.pointsBalance += points;
		this.totalPointsEarned += points;
	}

	public boolean redeemPoints(int points) {
		if (points <= 0 || points > this.pointsBalance) {
			return false;
		}
		this.pointsBalance -= points;
		this.totalPointsRedeemed += points;
		return true;
	}
}
