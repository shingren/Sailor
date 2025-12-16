package com.sailor.exception;

public class PagoInvalidoException extends RuntimeException {
    public PagoInvalidoException(String message) {
        super(message);
    }
}
