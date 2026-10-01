package com.warangal360.cityfix.contact;

import com.warangal360.cityfix.common.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contacts")
public class EmergencyContactController {

    private final EmergencyContactRepository contactRepository;

    public EmergencyContactController(EmergencyContactRepository contactRepository) {
        this.contactRepository = contactRepository;
    }

    @GetMapping("/public")
    public ResponseEntity<ApiResponse<List<EmergencyContact>>> getPublicContacts() {
        List<EmergencyContact> list = contactRepository.findAllByOrderByDisplayOrderAsc();
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<EmergencyContact>> createContact(@RequestBody EmergencyContact contact) {
        EmergencyContact saved = contactRepository.save(contact);
        return ResponseEntity.ok(ApiResponse.ok(saved));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<EmergencyContact>> updateContact(@PathVariable Long id, @RequestBody EmergencyContact contact) {
        contact.setId(id);
        EmergencyContact saved = contactRepository.save(contact);
        return ResponseEntity.ok(ApiResponse.ok(saved));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteContact(@PathVariable Long id) {
        contactRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.ok("Contact deleted", null));
    }
}
