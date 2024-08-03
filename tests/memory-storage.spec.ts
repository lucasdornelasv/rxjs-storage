import { provideMemoryStorage } from "../src/internal/memory-storage";
import { createTests } from "./default-tests.factory";

createTests("Memory Storage Service", provideMemoryStorage());
