package com.example

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.context.annotation.Bean
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.UrlBasedCorsConfigurationSource
import org.springframework.web.filter.CorsFilter
import org.springframework.web.multipart.MultipartFile
import java.math.BigInteger
import java.security.MessageDigest
import java.util.Base64
import java.util.concurrent.ConcurrentHashMap

data class TeacherCodeRequest(val eventId: String)

data class VerifyCodeRequest(val eventId: String, val code: String, val walletAddress: String)

data class ErrorResponse(val error: String)

data class VerifyResponse(
    val ok: Boolean,
    val codeHashHex: String,
    val eventId: String,
)

data class TeacherBadgeUploadRequest(
    val badge: String,
    val imageUrl: String? = null,
    val imageBase64: String? = null,
    /** Опционально: числовой id бейджа для `SetCodeBadge.badge` в контракте. */
    val badgeIdOnChain: Long? = null,
)

data class TeacherBadgeUploadResponse(
    val ok: Boolean,
    val badge: String,
    /** SHA-256 от строки `badge` (hex, 64 символа) — ключ в памяти и тот же код для контракта как int257. */
    val hashCode: String,
    /** То же значение в десятичном виде для ввода в скрипты / кошелёк (ClaimByCode / SetCodeBadge). */
    val hashCodeDecimal: String,
    val badgeIdOnChain: Long? = null,
)

data class StudentBadgesRequest(
    val hashCodes: List<String>,
)

data class StudentBadgeView(
    val hashCode: String,
    val hashCodeDecimal: String? = null,
    val badge: String,
    val imageUrl: String? = null,
    val imageBase64: String? = null,
    /** URL картинки на этом сервере (если бинарь был сохранён при загрузке). */
    val imagePublicUrl: String? = null,
)

data class StudentBadgesResponse(
    val ok: Boolean,
    val badges: List<StudentBadgeView>,
    val notFound: List<String>,
)

data class BadgeAsset(
    val badge: String,
    val imageUrl: String? = null,
    val imageBase64: String? = null,
    val imageBytes: ByteArray? = null,
    val imageContentType: String? = null,
    val badgeIdOnChain: Long? = null,
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

    /** JSON: картинка как URL или base64. */
    @PostMapping("/teacher/upload-badge", consumes = [MediaType.APPLICATION_JSON_VALUE])
    fun uploadBadgeJson(@RequestBody body: TeacherBadgeUploadRequest): ResponseEntity<Any> {
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

        var imageBytes: ByteArray? = null
        var imageContentType: String? = null
        if (!imageBase64.isNullOrBlank()) {
            val decoded = decodeBase64IfPresent(imageBase64)
            if (decoded.first == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ErrorResponse("invalid imageBase64"))
            }
            imageBytes = decoded.first
            imageContentType = decoded.second
        }

        return ResponseEntity.ok(
            storeBadgeAndRespond(
                badge = badge,
                imageUrl = imageUrl,
                imageBase64 = imageBase64?.trim()?.ifBlank { null },
                imageBytes = imageBytes,
                imageContentType = imageContentType,
                badgeIdOnChain = body.badgeIdOnChain,
            ),
        )
    }

    /** Multipart: поля формы `badge`, файл `image`; опционально `badgeIdOnChain` (число). */
    @PostMapping("/teacher/upload-badge", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    fun uploadBadgeMultipart(
        @RequestParam("badge") badgeRaw: String,
        @RequestParam("image") image: MultipartFile,
        @RequestParam(value = "badgeIdOnChain", required = false) badgeIdOnChainRaw: String?,
    ): ResponseEntity<Any> {
        val badge = badgeRaw.trim()
        if (badge.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ErrorResponse("badge is required"))
        }
        if (image.isEmpty) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ErrorResponse("image file is required"))
        }

        val badgeIdOnChain = badgeIdOnChainRaw?.trim()?.takeIf { it.isNotEmpty() }?.toLongOrNull()
        if (badgeIdOnChainRaw != null && badgeIdOnChainRaw.isNotBlank() && badgeIdOnChain == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ErrorResponse("badgeIdOnChain must be a number"))
        }

        val bytes = image.bytes
        if (bytes.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ErrorResponse("image file is empty"))
        }

        val ct = image.contentType?.takeIf { it.isNotBlank() } ?: MediaType.APPLICATION_OCTET_STREAM_VALUE

        return ResponseEntity.ok(
            storeBadgeAndRespond(
                badge = badge,
                imageUrl = null,
                imageBase64 = null,
                imageBytes = bytes,
                imageContentType = ct,
                badgeIdOnChain = badgeIdOnChain,
            ),
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
                        hashCodeDecimal = sha256AsPositiveDecimal(asset.badge),
                        badge = asset.badge,
                        imageUrl = asset.imageUrl,
                        imageBase64 = asset.imageBase64,
                        imagePublicUrl =
                            if (asset.imageBytes != null || !asset.imageBase64.isNullOrBlank()) {
                                "/api/badge/$hash/image"
                            } else {
                                null
                            },
                    ),
                )
            }
        }

        return ResponseEntity.ok(
            StudentBadgesResponse(
                ok = true,
                badges = found,
                notFound = notFound,
            ),
        )
    }

    /** Картинка по SHA-256 ключу (64 hex, как в `hashCode` после upload). */
    @GetMapping("/badge/{hashCode}/image")
    fun getBadgeImageByHash(@PathVariable hashCode: String): ResponseEntity<ByteArray> {
        val normalized = hashCode.trim().lowercase()
        if (!normalized.matches(Regex("^[0-9a-f]{64}$"))) {
            return ResponseEntity.badRequest().build()
        }
        return imageEntityForHash(normalized)
    }

    /** Картинка по человекочитаемому имени бейджа (тот же `badge`, что при загрузке). */
    @GetMapping("/badge/image")
    fun getBadgeImageByLabel(@RequestParam("badge") badgeLabel: String): ResponseEntity<ByteArray> {
        val badge = badgeLabel.trim()
        if (badge.isBlank()) {
            return ResponseEntity.badRequest().build()
        }
        val hash = sha256Hex(badge)
        return imageEntityForHash(hash)
    }

    private fun imageEntityForHash(normalizedHashHex: String): ResponseEntity<ByteArray> {
        val asset = badgeAssetsByHash[normalizedHashHex] ?: return ResponseEntity.notFound().build()

        val bytes: ByteArray =
            when {
                asset.imageBytes != null -> asset.imageBytes
                asset.imageBase64 != null ->
                    try {
                        Base64.getDecoder().decode(asset.imageBase64.trim())
                    } catch (_: IllegalArgumentException) {
                        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).build()
                    }
                else -> return ResponseEntity.notFound().build()
            }

        val ct = asset.imageContentType?.takeIf { it.isNotBlank() }
            ?: MediaType.APPLICATION_OCTET_STREAM_VALUE

        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(ct))
            .header("Cache-Control", "public, max-age=3600")
            .body(bytes)
    }

    private fun storeBadgeAndRespond(
        badge: String,
        imageUrl: String?,
        imageBase64: String?,
        imageBytes: ByteArray?,
        imageContentType: String?,
        badgeIdOnChain: Long?,
    ): TeacherBadgeUploadResponse {
        val hashHex = sha256Hex(badge)
        val hashDecimal = sha256AsPositiveDecimal(badge)
        badgeAssetsByHash[hashHex] =
            BadgeAsset(
                badge = badge,
                imageUrl = imageUrl,
                imageBase64 = imageBase64,
                imageBytes = imageBytes,
                imageContentType = imageContentType,
                badgeIdOnChain = badgeIdOnChain,
            )

        return TeacherBadgeUploadResponse(
            ok = true,
            badge = badge,
            hashCode = hashHex,
            hashCodeDecimal = hashDecimal,
            badgeIdOnChain = badgeIdOnChain,
        )
    }
}

private fun decodeBase64IfPresent(imageBase64: String?): Pair<ByteArray?, String?> {
    if (imageBase64 == null) return Pair(null, null)
    val trimmed = imageBase64.trim()
    if (trimmed.isEmpty()) return Pair(null, null)

    var payload = trimmed
    var contentType: String? = null
    val dataPrefix = Regex("^data:([^;]+);base64,(.*)$", RegexOption.IGNORE_CASE)
    val m = dataPrefix.find(payload)
    if (m != null) {
        contentType = m.groupValues[1].trim().ifBlank { null }
        payload = m.groupValues[2]
    }
    return try {
        Pair(Base64.getDecoder().decode(payload), contentType ?: MediaType.APPLICATION_OCTET_STREAM_VALUE)
    } catch (_: IllegalArgumentException) {
        Pair(null, null)
    }
}

private fun randomCode(length: Int = 6): String {
    val chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    return (1..length).map { chars.random() }.joinToString("")
}

private fun sha256Digest(input: String): ByteArray =
    MessageDigest.getInstance("SHA-256").digest(input.toByteArray(Charsets.UTF_8))

private fun sha256Hex(input: String): String =
    sha256Digest(input).joinToString("") { "%02x".format(it) }

/** Положительное big-endian число из SHA-256 — совпадает с `BigInt('0x' + hashCode)` в TS. */
private fun sha256AsPositiveDecimal(input: String): String =
    BigInteger(1, sha256Digest(input)).toString()
