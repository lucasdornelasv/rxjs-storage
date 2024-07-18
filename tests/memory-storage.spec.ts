import { provideMemoryStorage } from "../src/internal/helpers";
import { createTests } from "./default-tests.factory";

createTests("Memory Storage Service", provideMemoryStorage());
