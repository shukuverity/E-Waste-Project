package database;

public class Test {

    public static void main(String[] args) {

        DBOperations db = new DBOperations();

        System.out.println("=== TESTING DATABASE OPERATIONS ===\n");
        // INSERT TEST
        System.out.println("Inserting user...");
        db.addUser("John Doe", "john@example.com");
        
        // READ TEST
        System.out.println("\n--- USERS LIST ---");
        db.getUsers();

        // UPDATE TEST
        // db.updateUser(1, "John Updated", "johnupdated@gmail.com");

        // DELETE TEST
        // System.out.println("\nDeleting user...");
        // db.deleteUser(1);

        System.out.println("\n=== TEST COMPLETE ===");
    }
}