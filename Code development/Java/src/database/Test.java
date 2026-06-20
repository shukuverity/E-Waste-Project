package database;

public class Test {
    public static void main(String[] args) {
        System.out.println("=== TESTING DATABASE OPERATIONS ===");

        DBOperations db = new DBOperations();

        // 1. Generate a completely unique email using a system timestamp tag
        long timestampTag = System.currentTimeMillis() % 1000; 
        String uniqueEmail = "john.doe" + timestampTag + "@example.com";

        // 2. INSERT TEST
        System.out.println("Inserting user...");
        db.addUser("John Doe", uniqueEmail, "0712345678", "Password123", "household", "123 Main Street");

        // 3. READ TEST
        System.out.println("\n--- USERS LIST ---");
        db.getUsers();

        System.out.println("\n=== TEST COMPLETE ===");
    }
}