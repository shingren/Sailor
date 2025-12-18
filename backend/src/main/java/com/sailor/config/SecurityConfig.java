package com.sailor.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Autowired
    private UserDetailsService userDetailsService;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:5173",
            "http://localhost",
            "https://localhost"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers("/health").permitAll()
                .requestMatchers("/auth/**").permitAll()

                // Staff Management - ADMIN only
                .requestMatchers("/usuarios/**").hasRole("ADMIN")

                // MESAS - ADMIN, MESERO
                .requestMatchers("/mesas/**").hasAnyRole("ADMIN", "MESERO")

                // PRODUCTOS - ADMIN only
                .requestMatchers("/productos/**").hasRole("ADMIN")

                // PEDIDOS - Special handling for COCINA role
                .requestMatchers("/pedidos/activos").hasAnyRole("ADMIN", "MESERO", "COCINA")
                .requestMatchers("/pedidos/*/estado").hasAnyRole("ADMIN", "MESERO", "COCINA")
                .requestMatchers("/pedidos/**").hasAnyRole("ADMIN", "MESERO")

                // FACTURAS - ADMIN, CAJA
                .requestMatchers("/facturas/**").hasAnyRole("ADMIN", "CAJA")

                // PAGOS - ADMIN, CAJA
                .requestMatchers("/pagos/**").hasAnyRole("ADMIN", "CAJA")

                // CLIENTES - ADMIN, CAJA (for fiscal data in facturas)
                .requestMatchers("/clientes/**").hasAnyRole("ADMIN", "CAJA")

                // INVENTARIO - ADMIN, INVENTARIO
                .requestMatchers("/insumos/**").hasAnyRole("ADMIN", "INVENTARIO")
                .requestMatchers("/recetas/**").hasAnyRole("ADMIN", "INVENTARIO")

                // RESERVAS - ADMIN, MESERO
                .requestMatchers("/reservas/**").hasAnyRole("ADMIN", "MESERO")

                // REPORTES - ADMIN, GERENCIA
                .requestMatchers("/reportes/**").hasAnyRole("ADMIN", "GERENCIA")

                // CIERRE CAJA - ADMIN, CAJA
                .requestMatchers("/cierre-caja/**").hasAnyRole("ADMIN", "CAJA")

                // DASHBOARD - All authenticated users
                .requestMatchers("/dashboard/**").authenticated()

                // LOCATIONS - ADMIN, MESERO
                .requestMatchers("/locations/**").hasAnyRole("ADMIN", "MESERO")

                // All other endpoints require ADMIN
                .anyRequest().hasRole("ADMIN")
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
