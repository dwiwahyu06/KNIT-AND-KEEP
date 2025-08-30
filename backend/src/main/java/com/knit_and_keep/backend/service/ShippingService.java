// package com.knit_and_keep.backend.service;

// import okhttp3.*;
// import org.json.JSONArray;
// import org.json.JSONObject;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.beans.factory.annotation.Value;
// import org.springframework.stereotype.Service;

// import java.io.IOException;
// import java.util.ArrayList;
// import java.util.HashMap;
// import java.util.List;
// import java.util.Map;

// @Service
// public class ShippingService {

//     @Value("${rajaongkir.api.key}")
//     private String rajaOngkirApiKey;

//     private final OkHttpClient client;

//     @Autowired
//     public ShippingService(OkHttpClient client) {
//         this.client = client;
//     }

//     public List<Map<String, Object>> getShippingOptions(String origin, String destination, int weight, String courier) throws IOException {

//         if (weight <= 0) {
//             throw new IllegalArgumentException("Weight must be greater than 0 gram.");
//         }

//         // 1. MEMBUAT BODY DENGAN FORMAT x-www-form-urlencoded
//         RequestBody body = new FormBody.Builder()
//                 .add("origin", origin)
//                 .add("destination", destination)
//                 .add("weight", String.valueOf(weight))
//                 .add("courier", courier.toLowerCase())
//                 .build();

//         // 2. MENGGUNAKAN URL KOMERCE YANG BENAR DAN LENGKAP
//         Request request = new Request.Builder()
//                 .url("https://rajaongkir.komerce.id/api/v1/calculate/domestic-cost")
//                 .post(body)
//                 .addHeader("key", rajaOngkirApiKey)
//                 .addHeader("content-type", "application/x-www-form-urlencoded")
//                 .build();

//         try (Response response = client.newCall(request).execute()) {
//             String responseBody = response.body().string();
//             System.out.println("Komerce API Request to URL: " + request.url());
//             System.out.println("Komerce API Response Body: " + responseBody);

//             if (!response.isSuccessful()) {
//                 try {
//                     JSONObject errorJson = new JSONObject(responseBody);
//                     String errorMessage = errorJson.getJSONObject("meta").getString("message");
//                     throw new IOException("Komerce API Error: " + errorMessage);
//                 } catch (Exception e) {
//                     throw new IOException("Unexpected response code: " + response.code());
//                 }
//             }

//             // --- MULAI PERBAIKAN LOGIKA PARSING ---
//             JSONObject json = new JSONObject(responseBody);
//             JSONObject meta = json.getJSONObject("meta");

//             if (meta.getInt("code") != 200) {
//                 throw new IOException("Komerce API Error: " + meta.getString("message"));
//             }

//             // 3. MENGAMBIL DATA DARI STRUKTUR JSON YANG BARU ("data", bukan "rajaongkir")
//             JSONArray data = json.getJSONArray("data");
//             if (data.isEmpty()) {
//                 return new ArrayList<>(); // Kembalikan list kosong jika tidak ada opsi
//             }

//             // Mengambil "costs" dari objek pertama di dalam array "data"
//             JSONArray costs = data.getJSONObject(0).getJSONArray("costs");
//             List<Map<String, Object>> options = new ArrayList<>();

//             for (int i = 0; i < costs.length(); i++) {
//                 JSONObject cost = costs.getJSONObject(i);
//                 Map<String, Object> option = new HashMap<>();
//                 option.put("service", cost.getString("service"));
//                 option.put("description", cost.getString("description"));
//                 // Menambahkan nama kurir agar bisa ditampilkan di frontend
//                 option.put("courier_name", data.getJSONObject(0).optString("name", courier.toUpperCase()));

//                 JSONArray costDetails = cost.getJSONArray("cost");
//                 if (!costDetails.isEmpty()) {
//                     JSONObject costValue = costDetails.getJSONObject(0);
//                     option.put("cost", costValue.getInt("value"));
//                     option.put("etd", costValue.getString("etd"));
//                 } else {
//                     option.put("cost", 0);
//                     option.put("etd", "N/A");
//                 }
//                 options.add(option);
//             }
//             return options;
//             // --- AKHIR PERBAIKAN LOGIKA PARSING ---
//         }
//     }
// }


package com.knit_and_keep.backend.service;

import okhttp3.*;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ShippingService {

    @Value("${rajaongkir.api.key}")
    private String rajaOngkirApiKey;

    private final OkHttpClient client;

    @Autowired
    public ShippingService(OkHttpClient client) {
        this.client = client;
    }

    // --- METODE BARU UNTUK MENCARI DESTINASI ---
    public String searchDestinations(String searchTerm) throws IOException {
        HttpUrl.Builder urlBuilder = HttpUrl.parse("https://rajaongkir.komerce.id/api/v1/destination/domestic-destination").newBuilder();
        urlBuilder.addQueryParameter("search", searchTerm);

        Request request = new Request.Builder()
                .url(urlBuilder.build())
                .get() // Menggunakan metode GET
                .addHeader("key", rajaOngkirApiKey)
                .build();
        
        try (Response response = client.newCall(request).execute()) {
            String responseBody = response.body().string();
            System.out.println("Komerce Search API Response: " + responseBody);
            if (!response.isSuccessful()) {
                throw new IOException("Failed to search destinations from Komerce: " + responseBody);
            }
            return responseBody;
        }
    }
    // ---------------------------------------------

    public List<Map<String, Object>> getShippingOptions(String origin, String destination, int weight, String courier) throws IOException {
        if (weight <= 0) {
            throw new IllegalArgumentException("Weight must be greater than 0 gram.");
        }

        RequestBody body = new FormBody.Builder()
                .add("origin", origin)
                .add("destination", destination)
                .add("weight", String.valueOf(weight))
                .add("courier", courier.toLowerCase())
                .build();

        Request request = new Request.Builder()
                .url("https://rajaongkir.komerce.id/api/v1/calculate/domestic-cost")
                .post(body)
                .addHeader("key", rajaOngkirApiKey)
                .addHeader("content-type", "application/x-www-form-urlencoded")
                .build();

        try (Response response = client.newCall(request).execute()) {
            String responseBody = response.body().string();
            System.out.println("Komerce Cost API Response Body: " + responseBody);

            if (!response.isSuccessful()) {
                try {
                    JSONObject errorJson = new JSONObject(responseBody);
                    String errorMessage = errorJson.getJSONObject("meta").getString("message");
                    throw new IOException("Komerce API Error: " + errorMessage);
                } catch (Exception e) {
                    throw new IOException("Unexpected response code: " + response.code());
                }
            }

            JSONObject json = new JSONObject(responseBody);
            JSONObject meta = json.getJSONObject("meta");

            if (meta.getInt("code") != 200) {
                throw new IOException("Komerce API Error: " + meta.getString("message"));
            }

            JSONArray data = json.getJSONArray("data");
            if (data.isEmpty()) {
                return new ArrayList<>();
            }

            JSONArray costs = data.getJSONObject(0).getJSONArray("costs");
            List<Map<String, Object>> options = new ArrayList<>();
            for (int i = 0; i < costs.length(); i++) {
                JSONObject cost = costs.getJSONObject(i);
                Map<String, Object> option = new HashMap<>();
                option.put("service", cost.getString("service"));
                option.put("description", cost.getString("description"));
                option.put("courier_name", data.getJSONObject(0).getString("name")); 

                JSONArray costDetails = cost.getJSONArray("cost");
                if (!costDetails.isEmpty()) {
                    JSONObject costValue = costDetails.getJSONObject(0);
                    option.put("cost", costValue.getInt("value"));
                    option.put("etd", costValue.getString("etd"));
                } else {
                    option.put("cost", 0);
                    option.put("etd", "N/A");
                }
                options.add(option);
            }
            return options;
        }
    }
}

