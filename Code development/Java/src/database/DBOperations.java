package database;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class DBOperations {

    // INSERT USER
    public void addUser(String fullName, String email, String phone, String password, String role, String address) {
        String sql = "INSERT INTO users (full_name, email, phone, password, role, address) VALUES (?, ?, ?, ?, ?, ?)";
        
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement pst = conn.prepareStatement(sql)) {
            
            pst.setString(1, fullName);
            pst.setString(2, email);
            pst.setString(3, phone);
            pst.setString(4, password);
            pst.setString(5, role);
            pst.setString(6, address);
            
            int rows = pst.executeUpdate();
            System.out.println(rows + " user(s) registered successfully!");
            
        } catch (SQLException e) {
            System.err.println("Insert error: " + e.getMessage());
        }
    }

    // READ USERS
    public void getUsers() {
    // This query looks up the exact check constraint definition for your roles column
    String sql = "SELECT check_clause FROM information_schema.check_constraints " +
                 "WHERE constraint_name = 'users_role_check'";
    
    try (Connection conn = DBConnection.getConnection();
         PreparedStatement pst = conn.prepareStatement(sql);
         ResultSet rs = pst.executeQuery()) {
         
        System.out.println("--- ALLOWED ROLES IN YOUR CONSTRAINT ---");
        if (rs.next()) {
            System.out.println("Your constraint rule is: " + rs.getString("check_clause"));
        } else {
            System.out.println("Could not read constraint details directly. Try lower-case 'household'.");
        }
        System.out.println("----------------------------------------");
        
    } catch (SQLException e) {
        System.err.println("Inspection error: " + e.getMessage());
    }
    }
}