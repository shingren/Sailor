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
            admin.setEmail("admin@sailor.com");
            admin.setPasswordHash(passwordEncoder.encode("admin123"));
            admin.setRol("ADMIN");

            Usuario user = new Usuario();
            user.setEmail("user@sailor.com");
            user.setPasswordHash(passwordEncoder.encode("user123"));
            user.setRol("USER");

            usuarioRepository.save(admin);
            usuarioRepository.save(user);
            System.out.println("Default users created: admin@sailor.com, user@sailor.com");
        }
    }
}
