package com.hooplab.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class AdminApiKeyFilter extends OncePerRequestFilter {

    @Value("${hooplab.admin.api-key:}")
    private String apiKey;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/api/admin/");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        if (apiKey == null || apiKey.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }
        String provided = request.getHeader("X-Admin-Key");
        if (apiKey.equals(provided)) {
            filterChain.doFilter(request, response);
            return;
        }
        response.sendError(HttpStatus.UNAUTHORIZED.value(), "Invalid or missing X-Admin-Key header");
    }
}
