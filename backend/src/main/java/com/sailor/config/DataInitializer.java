package com.sailor.config;

import com.sailor.entity.Usuario;
import com.sailor.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (usuarioRepository.count() == 0) {
            Usuario admin = new Usuario();
            admin.setEmail("admin@sailor.local");
            admin.setPasswordHash(passwordEncoder.encode("Admin#123"));
            admin.setRol("ADMIN");

            usuarioRepository.save(admin);
            System.out.println("Default admin user created: admin@sailor.local");
        }
    }
}
