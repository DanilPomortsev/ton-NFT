package com.example

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.context.annotation.Bean
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.UrlBasedCorsConfigurationSource
import org.springframework.web.filter.CorsFilter
import java.security.MessageDigest
import java.util.concurrent.ConcurrentHashMap

data class TeacherCodeRequest(val eventId: String)

data class VerifyCodeRequest(val eventId: String, val code: String, val walletAddress: String)

data class ErrorResponse(val error: String)

data class VerifyResponse(
    val ok: Boolean,
    val codeHashHex: String,
    val eventId: String
)

data class TeacherBadgeUploadRequest(
    val badge: String,
    val imageUrl: String? = null,
    val imageBase64: String? = null
)

data class TeacherBadgeUploadResponse(
    val ok: Boolean,
    val badge: String,
    val hashCode: String
)

data class StudentBadgesRequest(
    val hashCodes: List<String>
)

data class StudentBadgeView(
    val hashCode: String,
    val badge: String,
    val imageUrl: String? = null,
    val imageBase64: String? = null
)

data class StudentBadgesResponse(
    val ok: Boolean,
    val badges: List<StudentBadgeView>,
    val notFound: List<String>
)

data class BadgeAsset(
    val badge: String,
    val imageUrl: String? = null,
    val imageBase64: String? = null
)

private val eventCodes = ConcurrentHashMap<String, String>()
private val badgeAssetsByHash = ConcurrentHashMap<String, BadgeAsset>()

@SpringBootApplication
class AttendanceBackendApplication {
    @Bean
    fun corsFilter(): CorsFilter {
        val config = CorsConfiguration()
        config.allowedOriginPatterns = listOf("*")
        config.allowedMethods = listOf("GET", "POST", "OPTIONS")
        config.allowedHeaders = listOf("*")
        val source = UrlBasedCorsConfigurationSource()
        source.registerCorsConfiguration("/**", config)
        return CorsFilter(source)
    }
}

fun main(args: Array<String>) {
    runApplication<AttendanceBackendApplication>(*args)
}

@RestController
@RequestMapping("/api")
class ApiController {
    @GetMapping("/health")
    fun health(): Map<String, Boolean> = mapOf("ok" to true)

    @PostMapping("/teacher/code")
    fun teacherCode(@RequestBody body: TeacherCodeRequest): ResponseEntity<Any> {
        val eventId = body.eventId.trim()
        if (eventId.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ErrorResponse("eventId is required"))
        }

        val code = randomCode()
        eventCodes[eventId] = code
        return ResponseEntity.ok(mapOf("eventId" to eventId, "code" to code))
    }

    @PostMapping("/student/verify-code")
    fun verifyCode(@RequestBody body: VerifyCodeRequest): ResponseEntity<Any> {
        val eventId = body.eventId.trim()
        val code = body.code.trim().uppercase()
        val walletAddress = body.walletAddress.trim()

        if (eventId.isBlank() || code.isBlank() || walletAddress.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ErrorResponse("eventId, code and walletAddress are required"))
        }

        val stored = eventCodes[eventId]
        if (stored == null || stored != code) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ErrorResponse("invalid code"))
        }

        val codeHashHex = sha256Hex(code)
        return ResponseEntity.ok(VerifyResponse(ok = true, codeHashHex = codeHashHex, eventId = eventId))
    }

    @PostMapping("/teacher/upload-badge")
    fun uploadBadge(@RequestBody body: TeacherBadgeUploadRequest): ResponseEntity<Any> {
        val badge = body.badge.trim()
        val imageUrl = body.imageUrl?.trim()?.ifBlank { null }
        val imageBase64 = body.imageBase64?.trim()?.ifBlank { null }

        if (badge.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ErrorResponse("badge is required"))
        }
        if (imageUrl == null && imageBase64 == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ErrorResponse("imageUrl or imageBase64 is required"))
        }

        // hashCode that teacher can write to TON contract in codeToBadge mapping.
        val hashCode = sha256Hex(badge)
        badgeAssetsByHash[hashCode] = BadgeAsset(
            badge = badge,
            imageUrl = imageUrl,
            imageBase64 = imageBase64
        )

        return ResponseEntity.ok(
            TeacherBadgeUploadResponse(
                ok = true,
                badge = badge,
                hashCode = hashCode
            )
        )
    }

    @PostMapping("/student/badges")
    fun getStudentBadges(@RequestBody body: StudentBadgesRequest): ResponseEntity<Any> {
        if (body.hashCodes.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ErrorResponse("hashCodes is required"))
        }

        val cleaned = body.hashCodes.map { it.trim().lowercase() }.filter { it.isNotBlank() }
        if (cleaned.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ErrorResponse("hashCodes is required"))
        }

        val found = mutableListOf<StudentBadgeView>()
        val notFound = mutableListOf<String>()
        for (hash in cleaned) {
            val asset = badgeAssetsByHash[hash]
            if (asset == null) {
                notFound.add(hash)
            } else {
                found.add(
                    StudentBadgeView(
                        hashCode = hash,
                        badge = asset.badge,
                        imageUrl = asset.imageUrl,
                        imageBase64 = asset.imageBase64
                    )
                )
            }
        }

        return ResponseEntity.ok(
            StudentBadgesResponse(
                ok = true,
                badges = found,
                notFound = notFound
            )
        )
    }
}

private fun randomCode(length: Int = 6): String {
    val chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    return (1..length).map { chars.random() }.joinToString("")
}

private fun sha256Hex(input: String): String {
    val digest = MessageDigest.getInstance("SHA-256").digest(input.toByteArray())
    return digest.joinToString("") { "%02x".format(it) }
}

