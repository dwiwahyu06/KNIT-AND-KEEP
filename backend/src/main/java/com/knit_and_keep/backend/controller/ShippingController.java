// package com.knit_and_keep.backend.controller;

// import com.knit_and_keep.backend.model.ShippingCostRequest;
// import com.knit_and_keep.backend.service.ShippingService;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.http.HttpStatus;
// import org.springframework.http.ResponseEntity;
// import org.springframework.web.bind.annotation.*;

// import java.util.List;
// import java.util.Map;

// @RestController
// @RequestMapping("/api/shipping")
// public class ShippingController {

//     @Autowired
//     private ShippingService shippingService;

//     @PostMapping("/cost")
//     public ResponseEntity<?> getCost(@RequestBody ShippingCostRequest request) {
//         try {
//             // Logging input dari request body menjadi lebih mudah dengan DTO
//             System.out.println("Received request with: " + request.toString());

//             List<Map<String, Object>> options = shippingService.getShippingOptions(
//                     request.getOrigin(),
//                     request.getDestination(),
//                     request.getWeight(),
//                     request.getCourier()
//             );

//             return ResponseEntity.ok(options);
//         } catch (IllegalArgumentException e) {
//             // Tangani error jika berat tidak valid
//             return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
//         } catch (Exception e) {
//             // Tangani semua error lain (misalnya dari API RajaOngkir)
//             e.printStackTrace();
//             return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
//         }
//     }
// }


// package com.knit_and_keep.backend.controller;

// import com.knit_and_keep.backend.service.ShippingService;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.http.HttpStatus;
// import org.springframework.http.ResponseEntity;
// import org.springframework.web.bind.annotation.*;

// import java.util.List;
// import java.util.Map;

// @RestController
// @RequestMapping("/api/shipping")
// public class ShippingController {

//     @Autowired
//     private ShippingService shippingService;

//     @PostMapping("/cost")
//     // MENGGUNAKAN @RequestParam UNTUK MENERIMA DATA form-urlencoded
//     public ResponseEntity<?> getCost(
//             @RequestParam String origin,
//             @RequestParam String destination,
//             @RequestParam int weight,
//             @RequestParam String courier) {
//         try {
//             System.out.println("Received request with: origin=" + origin + ", destination=" + destination + ", weight=" + weight + ", courier=" + courier);
//             List<Map<String, Object>> options = shippingService.getShippingOptions(origin, destination, weight, courier);
//             return ResponseEntity.ok(options);
//         } catch (IllegalArgumentException e) {
//             return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
//         } catch (Exception e) {
//             e.printStackTrace();
//             return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
//         }
//     }
// }


package com.knit_and_keep.backend.controller;

import com.knit_and_keep.backend.service.ShippingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/shipping")
public class ShippingController {

    @Autowired
    private ShippingService shippingService;

    /**
     * Endpoint baru untuk mencari alamat.
     * Frontend akan memanggil endpoint ini untuk menghindari masalah CORS.
     */
    @GetMapping(value = "/search-destination", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> searchDestination(@RequestParam String search) {
        try {
            String result = shippingService.searchDestinations(search);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            // Mengembalikan error dalam format JSON agar mudah dibaca frontend
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                 .body("{\"meta\":{\"status\":\"error\", \"message\":\"" + e.getMessage() + "\"},\"data\":[]}");
        }
    }

    /**
     * Endpoint untuk menghitung ongkos kirim.
     */
    @PostMapping("/cost")
    public ResponseEntity<?> getCost(
            @RequestParam String origin,
            @RequestParam String destination,
            @RequestParam int weight,
            @RequestParam String courier) {
        try {
            List<Map<String, Object>> options = shippingService.getShippingOptions(origin, destination, weight, courier);
            return ResponseEntity.ok(options);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }
}

