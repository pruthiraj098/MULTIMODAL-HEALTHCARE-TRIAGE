def validate_age(age):
    return 0 <= age <= 120


def validate_spo2(spo2):
    return 0 <= spo2 <= 100


def validate_temperature(temperature):
    return 25 <= temperature <= 45


def validate_heart_rate(heart_rate):
    return 0 <= heart_rate <= 250


def validate_respiratory_rate(rate):
    return 0 <= rate <= 80