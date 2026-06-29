(function () {
		const signupForm = document.getElementById("signup-form");
		const fullNameInput = document.getElementById("full-name");
		const emailInput = document.getElementById("email");
		const phoneInput = document.getElementById("phone");
		const roleInput = document.getElementById("role");
		const passwordInput = document.getElementById("password");
		const confirmPasswordInput = document.getElementById("confirm-password");
		const errorText = document.getElementById("signup-error");

		if (!signupForm || !fullNameInput || !emailInput || !phoneInput || !roleInput || !passwordInput || !confirmPasswordInput || !errorText) {
			return;
		}

		function getAccounts() {
			const rawAccounts = localStorage.getItem("ewaste_accounts");
			if (!rawAccounts) {
				return [];
			}

			try {
				const parsed = JSON.parse(rawAccounts);
				return Array.isArray(parsed) ? parsed : [];
			} catch (error) {
				return [];
			}
		}

		function saveAccounts(accounts) {
			localStorage.setItem("ewaste_accounts", JSON.stringify(accounts));
		}

		signupForm.addEventListener("submit", function (event) {
			event.preventDefault();
			errorText.style.display = "none";
			errorText.textContent = "Passwords do not match.";

			const sanitizedPhone = phoneInput.value.replace(/\D/g, "").slice(0, 10);
			phoneInput.value = sanitizedPhone;

			if (sanitizedPhone.length !== 10) {
				errorText.textContent = "Phone number must be exactly 10 digits.";
				errorText.style.display = "block";
				phoneInput.focus();
				return;
			}

			if (passwordInput.value !== confirmPasswordInput.value) {
				errorText.style.display = "block";
				confirmPasswordInput.focus();
				return;
			}

			const email = emailInput.value.trim().toLowerCase();
			const accounts = getAccounts();
			const existingAccount = accounts.find(function (account) {
				return account.email === email;
			});

			if (existingAccount) {
				errorText.textContent = "An account with this email already exists.";
				errorText.style.display = "block";
				emailInput.focus();
				return;
			}

			accounts.push({
				fullName: fullNameInput.value.trim(),
				email: email,
				phoneNumber: sanitizedPhone,
				role: roleInput.value,
				password: passwordInput.value,
				pointsBalance: 0,
				totalPointsEarned: 0,
				totalPointsRedeemed: 0
			});

			saveAccounts(accounts);
			window.location.href = "login.html";
		});

		phoneInput.addEventListener("input", function () {
			const onlyDigits = phoneInput.value.replace(/\D/g, "").slice(0, 10);
			if (phoneInput.value !== onlyDigits) {
				phoneInput.value = onlyDigits;
			}
		});
	})();