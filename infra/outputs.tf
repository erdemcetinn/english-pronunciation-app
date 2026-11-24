output "audio_bucket" {
  value = aws_s3_bucket.audio.bucket
}

output "audio_base_url" {
  description = "Put this in .env as EXPO_PUBLIC_AUDIO_BASE_URL."
  value       = "https://${aws_cloudfront_distribution.audio.domain_name}"
}
