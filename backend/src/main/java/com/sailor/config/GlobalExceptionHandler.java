package com.sailor.config;

import com.sailor.exception.FacturaAlreadyExistsException;
import com.sailor.exception.InvalidPedidoEstadoException;
import com.sailor.exception.PagoInvalidoException;
import com.sailor.exception.FacturaYaPagadaException;
import com.sailor.exception.MontoExcedeSaldoException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(FacturaAlreadyExistsException.class)
    public ResponseEntity<Map<String, String>> handleFacturaAlreadyExistsException(FacturaAlreadyExistsException ex) {
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("error", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
    }

    @ExceptionHandler(InvalidPedidoEstadoException.class)
    public ResponseEntity<Map<String, String>> handleInvalidPedidoEstadoException(InvalidPedidoEstadoException ex) {
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("error", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    @ExceptionHandler(PagoInvalidoException.class)
    public ResponseEntity<Map<String, String>> handlePagoInvalidoException(PagoInvalidoException ex) {
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("error", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    @ExceptionHandler(FacturaYaPagadaException.class)
    public ResponseEntity<Map<String, String>> handleFacturaYaPagadaException(FacturaYaPagadaException ex) {
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("error", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    @ExceptionHandler(MontoExcedeSaldoException.class)
    public ResponseEntity<Map<String, String>> handleMontoExcedeSaldoException(MontoExcedeSaldoException ex) {
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("error", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("error", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }
}
