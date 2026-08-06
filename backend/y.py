from keras.models import load_model

model = load_model(
    "ml/models/bangus_buhai_lstm_exp2.keras",
    compile=False
)

print("Loaded!")