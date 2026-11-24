# Private S3 bucket with pre-generated Polly mp3s, served only through CloudFront.

resource "aws_s3_bucket" "audio" {
  bucket = "pronunciation-app-audio-${random_id.suffix.hex}"
}

resource "aws_s3_bucket_public_access_block" "audio" {
  bucket                  = aws_s3_bucket.audio.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_cloudfront_origin_access_control" "audio" {
  name                              = "pronunciation-app-audio"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# AWS managed policy "CachingOptimized".
data "aws_cloudfront_cache_policy" "caching_optimized" {
  name = "Managed-CachingOptimized"
}

resource "aws_cloudfront_distribution" "audio" {
  enabled         = true
  comment         = "Pronunciation app audio"
  price_class     = "PriceClass_100"
  is_ipv6_enabled = true

  origin {
    domain_name              = aws_s3_bucket.audio.bucket_regional_domain_name
    origin_id                = "audio-s3"
    origin_access_control_id = aws_cloudfront_origin_access_control.audio.id
  }

  default_cache_behavior {
    target_origin_id       = "audio-s3"
    viewer_protocol_policy = "https-only"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    cache_policy_id        = data.aws_cloudfront_cache_policy.caching_optimized.id
    compress               = false
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

# Only this CloudFront distribution may read the bucket.
data "aws_iam_policy_document" "audio_read" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.audio.arn}/*"]
    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.audio.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "audio" {
  bucket     = aws_s3_bucket.audio.id
  policy     = data.aws_iam_policy_document.audio_read.json
  depends_on = [aws_s3_bucket_public_access_block.audio]
}
