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
        String sql = "SELECT id, full_name, email, phone, role, address, created_at FROM users ORDER BY id";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement pst = conn.prepareStatement(sql);
             ResultSet rs = pst.executeQuery()) {

            System.out.println("--- USERS LIST ---");
            boolean foundAny = false;

            while (rs.next()) {
                foundAny = true;
                System.out.println(
                    "ID: " + rs.getInt("id")
                    + " | Name: " + rs.getString("full_name")
                    + " | Email: " + rs.getString("email")
                    + " | Phone: " + rs.getString("phone")
                    + " | Role: " + rs.getString("role")
                    + " | Address: " + rs.getString("address")
                    + " | Created: " + rs.getTimestamp("created_at")
                );
            }

            if (!foundAny) {
                System.out.println("No users found in the users table.");
            }

            System.out.println("------------------");
        } catch (SQLException e) {
            System.err.println("Read error: " + e.getMessage());
        }
    }
}