package database;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DBConnection {

    // PostgreSQL database details
    private static final String URL = "jdbc:postgresql://localhost:5432/e_waste_db";
    private static final String USER = "postgres";
    private static final String PASSWORD = "mihatasijui";

    public static Connection getConnection() {
        Connection conn = null;

        try {
            // PostgreSQL driver
            Class.forName("org.postgresql.Driver");

            conn = DriverManager.getConnection(URL, USER, PASSWORD);
            System.out.println("Database Connected Successfully!");

        } catch (ClassNotFoundException e) {
            System.out.println("PostgreSQL Driver not found.");
            e.printStackTrace();

        } catch (SQLException e) {
            System.out.println("Connection failed: " + e.getMessage());
            e.printStackTrace();
        }

        return conn;
    }
}