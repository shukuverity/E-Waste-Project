package database;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class DBOperations {

    // INSERT USER
    public void addUser(String name, String email) {
        String sql = "INSERT INTO users(name, email) VALUES(?, ?)";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement pst = conn.prepareStatement(sql)) {

            pst.setString(1, name);
            pst.setString(2, email);

            int rows = pst.executeUpdate();
            System.out.println(rows + " user(s) added.");

        } catch (SQLException e) {
            System.out.println("Insert error: " + e.getMessage());
        }
    }
    // READ ALL USERS
    public void getUsers() {
        String sql = "SELECT * FROM users ORDER BY id";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement pst = conn.prepareStatement(sql);
             ResultSet rs = pst.executeQuery()) {

            System.out.println("ID | Name | Email");
            System.out.println("------------------------");

            while (rs.next()) {
                System.out.println(
                    rs.getInt("id") + " | " +
                    rs.getString("name") + " | " +
                    rs.getString("email")
                );
            }

        } catch (SQLException e) {
            System.out.println("Fetch error: " + e.getMessage());
        }
    }
    // UPDATE USER
    public void updateUser(int id, String name, String email) {
        String sql = "UPDATE users SET name = ?, email = ? WHERE id = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement pst = conn.prepareStatement(sql)) {

            pst.setString(1, name);
            pst.setString(2, email);
            pst.setInt(3, id);

            int rows = pst.executeUpdate();
            System.out.println(rows + " user(s) updated.");

        } catch (SQLException e) {
            System.out.println("Update error: " + e.getMessage());
        }
    }

    // DELETE USER
    public void deleteUser(int id) {
        String sql = "DELETE FROM users WHERE id = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement pst = conn.prepareStatement(sql)) {

            pst.setInt(1, id);

            int rows = pst.executeUpdate();
            System.out.println(rows + " user(s) deleted.");

        } catch (SQLException e) {
            System.out.println("Delete error: " + e.getMessage());
        }
    }
}